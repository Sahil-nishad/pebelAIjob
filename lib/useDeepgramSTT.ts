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
  onAudioLevel?: (level: number) => void  // 0..1 normalized RMS
  onError?: (err: string) => void
  silenceMs?: number          // ms of silence AFTER speech detected before auto-stop
  maxWaitForSpeechMs?: number // max ms to wait for user to start speaking (then auto-stop)
  maxRecordingMs?: number     // hard cap on recording duration
  language?: string           // default 'en-IN'
}

// Voice activity threshold — frequency-bin avg above this means user is speaking
// Lower = more sensitive to quiet speech. 8-12 works well for most mics.
const VOICE_THRESHOLD = 10

export function useDeepgramSTT({
  onTranscript,
  onAudioLevel,
  onError,
  silenceMs = 2000,
  maxWaitForSpeechMs = 30000,
  maxRecordingMs = 90000,
  language = 'en-IN',
}: UseDeepgramSTTOptions) {
  const [status, setStatus] = useState<STTStatus>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRecordingRef = useRef(false)
  const hasSpokenRef = useRef(false)
  const deepgramAvailableRef = useRef<boolean | null>(null)

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

  // ── Cleanup helpers ─────────────────────────────────────────────────────
  const stopSilenceDetection = useCallback(() => {
    if (silenceCheckRef.current) { clearInterval(silenceCheckRef.current); silenceCheckRef.current = null }
    if (maxDurationTimerRef.current) { clearTimeout(maxDurationTimerRef.current); maxDurationTimerRef.current = null }
    try { audioContextRef.current?.close() } catch {}
    audioContextRef.current = null
    analyserRef.current = null
  }, [])

  // ── Voice activity detection ────────────────────────────────────────────
  // Critical: only count silence AFTER user has actually started speaking.
  // Otherwise recording stops before user gets a chance to talk.
  const startSilenceDetection = useCallback((stream: MediaStream, onAutoStop: () => void) => {
    try {
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 512
      analyserRef.current.smoothingTimeConstant = 0.3

      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      const data = new Uint8Array(analyserRef.current.frequencyBinCount)
      const CHECK_INTERVAL = 150 // ms

      let silentFor = 0
      let waitedForSpeech = 0
      let stopped = false  // guard against firing onAutoStop more than once
      hasSpokenRef.current = false

      silenceCheckRef.current = setInterval(() => {
        if (stopped || !analyserRef.current) return
        analyserRef.current.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length

        if (onAudioLevel) onAudioLevel(Math.min(avg / 80, 1))

        if (avg >= VOICE_THRESHOLD) {
          // User is speaking — reset silence counter, mark as spoken
          hasSpokenRef.current = true
          silentFor = 0
        } else if (hasSpokenRef.current) {
          // User spoke and now is silent — count silence toward auto-stop
          silentFor += CHECK_INTERVAL
          if (silentFor >= silenceMs) {
            stopped = true
            onAutoStop()
          }
        } else {
          // User hasn't spoken yet — wait. If they never speak, give up after maxWaitForSpeechMs.
          waitedForSpeech += CHECK_INTERVAL
          if (waitedForSpeech >= maxWaitForSpeechMs) {
            stopped = true
            onAutoStop()
          }
        }
      }, CHECK_INTERVAL)

      // Hard cap on total recording duration
      maxDurationTimerRef.current = setTimeout(() => {
        if (isRecordingRef.current && !stopped) {
          stopped = true
          onAutoStop()
        }
      }, maxRecordingMs)
    } catch (err) {
      // AudioContext failed — fall back to plain timer
      maxDurationTimerRef.current = setTimeout(onAutoStop, silenceMs + 5000)
    }
  }, [silenceMs, maxWaitForSpeechMs, maxRecordingMs, onAudioLevel])

  // ── Start recording ─────────────────────────────────────────────────────
  const startRecording = useCallback(async (autoStopOnSilence = true): Promise<boolean> => {
    if (isRecordingRef.current) return false

    // Feature-detect MediaRecorder
    if (typeof MediaRecorder === 'undefined') {
      onError?.('MediaRecorder not supported in this browser')
      return false
    }

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
      hasSpokenRef.current = false

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
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        isRecordingRef.current = false
        const userDidSpeak = hasSpokenRef.current
        stopSilenceDetection()

        // Stop mic tracks
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null

        if (onAudioLevel) onAudioLevel(0)

        if (chunksRef.current.length === 0) {
          setStatus('idle')
          onTranscript('', true)
          return
        }

        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        chunksRef.current = []

        // If user never spoke (audio energy stayed below threshold), don't waste API call
        if (!userDidSpeak) {
          setStatus('idle')
          onTranscript('', true)
          return
        }

        // Skip very tiny recordings (< 800ms of audio at low bitrate ≈ 1200 bytes)
        if (blob.size < 1200) {
          setStatus('idle')
          onTranscript('', true)
          return
        }

        setStatus('processing')
        const text = await transcribeBlob(blob)
        setStatus('idle')
        onTranscript(text, true)
      }

      recorder.onerror = () => {
        isRecordingRef.current = false
        setStatus('error')
        onError?.('Recording failed')
      }

      // Start collecting audio chunks every 250ms
      recorder.start(250)
      isRecordingRef.current = true
      setStatus('recording')

      // Set up voice activity detection
      if (autoStopOnSilence) {
        startSilenceDetection(stream, () => {
          if (isRecordingRef.current) {
            try { recorder.stop() } catch {}
          }
        })
      } else {
        // Push-to-talk mode: still need max-duration safety
        maxDurationTimerRef.current = setTimeout(() => {
          if (isRecordingRef.current) {
            try { recorder.stop() } catch {}
          }
        }, maxRecordingMs)
      }

      return true
    } catch (err: any) {
      setStatus('error')
      onError?.(err?.message || 'Microphone access denied')
      return false
    }
  }, [onTranscript, onError, onAudioLevel, transcribeBlob, startSilenceDetection, stopSilenceDetection, maxRecordingMs])

  // ── Stop recording (push-to-talk release) ──────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      try { mediaRecorderRef.current.stop() } catch {}
    }
  }, [])

  // ── Abort (discard audio, don't transcribe) ─────────────────────────────
  const abortRecording = useCallback(() => {
    stopSilenceDetection()
    isRecordingRef.current = false
    chunksRef.current = []
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.onstop = () => {}
        mediaRecorderRef.current.stop()
      } catch {}
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (onAudioLevel) onAudioLevel(0)
    setStatus('idle')
  }, [stopSilenceDetection, onAudioLevel])

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
