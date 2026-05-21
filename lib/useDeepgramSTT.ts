/**
 * useDeepgramSTT — MediaRecorder → Deepgram nova-2 STT hook
 *
 * Replaces the browser Web Speech API for much better accuracy,
 * especially for Indian English and technical vocabulary.
 *
 * Falls back to Web Speech API if:
 *  - Deepgram STT route returns 503 (key not configured)
 *  - MediaRecorder is not supported
 */

import { useRef, useCallback, useState } from 'react'

export type STTStatus = 'idle' | 'recording' | 'processing' | 'error'

interface UseDeepgramSTTOptions {
  onTranscript: (text: string, isFinal: boolean) => void
  onError?: (err: string) => void
  silenceMs?: number          // ms of silence before auto-stop (desktop mode)
  language?: string           // default 'en-IN'
}

export function useDeepgramSTT({
  onTranscript,
  onError,
  silenceMs = 2500,
  language = 'en-IN',
}: UseDeepgramSTTOptions) {
  const [status, setStatus] = useState<STTStatus>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isRecordingRef = useRef(false)
  const deepgramAvailableRef = useRef<boolean | null>(null) // null = unknown, true/false = tested

  // ── Deepgram transcription ──────────────────────────────────────────────
  const transcribeBlob = useCallback(async (blob: Blob): Promise<string> => {
    try {
      const form = new FormData()
      form.append('audio', blob, 'audio.webm')

      const res = await fetch('/api/coach/stt', {
        method: 'POST',
        body: form,
        credentials: 'same-origin',
      })

      if (res.status === 503) {
        // Deepgram not configured — mark unavailable
        deepgramAvailableRef.current = false
        return ''
      }

      if (!res.ok) return ''

      deepgramAvailableRef.current = true
      const data = await res.json()
      return (data.transcript || '').trim()
    } catch {
      return ''
    }
  }, [])

  // ── Silence detection via AudioContext analyser ─────────────────────────
  const startSilenceDetection = useCallback((stream: MediaStream, onSilence: () => void) => {
    try {
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 512
      analyserRef.current.smoothingTimeConstant = 0.3

      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      const data = new Uint8Array(analyserRef.current.frequencyBinCount)
      let silentFor = 0
      const CHECK_INTERVAL = 200 // ms

      silenceCheckRef.current = setInterval(() => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        if (avg < 8) {
          // Very quiet — count silence
          silentFor += CHECK_INTERVAL
          if (silentFor >= silenceMs) {
            onSilence()
          }
        } else {
          silentFor = 0
        }
      }, CHECK_INTERVAL)
    } catch {
      // AudioContext not available — use timer fallback
      silenceTimerRef.current = setTimeout(onSilence, silenceMs + 1000)
    }
  }, [silenceMs])

  const stopSilenceDetection = useCallback(() => {
    if (silenceCheckRef.current) { clearInterval(silenceCheckRef.current); silenceCheckRef.current = null }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    try { audioContextRef.current?.close() } catch {}
    audioContextRef.current = null
    analyserRef.current = null
  }, [])

  // ── Start recording ─────────────────────────────────────────────────────
  const startRecording = useCallback(async (autoStopOnSilence = true): Promise<boolean> => {
    if (isRecordingRef.current) return false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      })

      streamRef.current = stream
      chunksRef.current = []

      // Pick best supported MIME type
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ].find(t => MediaRecorder.isTypeSupported(t)) || ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        isRecordingRef.current = false
        stopSilenceDetection()

        // Stop mic tracks
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null

        if (chunksRef.current.length === 0) {
          setStatus('idle')
          return
        }

        setStatus('processing')
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        chunksRef.current = []

        // Skip very short recordings (< 300ms) — likely noise
        if (blob.size < 1000) {
          setStatus('idle')
          return
        }

        const text = await transcribeBlob(blob)
        setStatus('idle')

        if (text) {
          onTranscript(text, true)
        }
      }

      recorder.onerror = () => {
        isRecordingRef.current = false
        setStatus('error')
        onError?.('Recording failed')
      }

      recorder.start(250) // collect chunks every 250ms
      isRecordingRef.current = true
      setStatus('recording')

      // Auto-stop on silence (desktop mode)
      if (autoStopOnSilence) {
        startSilenceDetection(stream, () => {
          if (isRecordingRef.current) stopRecording()
        })
      }

      return true
    } catch (err: any) {
      setStatus('error')
      onError?.(err?.message || 'Microphone access denied')
      return false
    }
  }, [onTranscript, onError, transcribeBlob, startSilenceDetection, stopSilenceDetection])

  // ── Stop recording ──────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    stopSilenceDetection()
    if (mediaRecorderRef.current && isRecordingRef.current) {
      try { mediaRecorderRef.current.stop() } catch {}
    }
  }, [stopSilenceDetection])

  // ── Abort (discard audio, don't transcribe) ─────────────────────────────
  const abortRecording = useCallback(() => {
    stopSilenceDetection()
    isRecordingRef.current = false
    chunksRef.current = []
    if (mediaRecorderRef.current) {
      try {
        // Override onstop to discard
        mediaRecorderRef.current.onstop = () => {}
        mediaRecorderRef.current.stop()
      } catch {}
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setStatus('idle')
  }, [stopSilenceDetection])

  const isDeepgramAvailable = deepgramAvailableRef.current !== false

  return {
    status,
    isRecording: status === 'recording',
    isProcessing: status === 'processing',
    startRecording,
    stopRecording,
    abortRecording,
    isDeepgramAvailable,
  }
}
