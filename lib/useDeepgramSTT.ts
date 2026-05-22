/**
 * useDeepgramSTT — Voice Activity Detection + Deepgram nova-2 STT
 *
 * How it works:
 *  1. Mic opens, MediaRecorder starts capturing
 *  2. Time-domain RMS analyser monitors energy in real-time (300Hz refresh)
 *  3. When user starts speaking (RMS > start threshold) → mark "speaking"
 *  4. When user goes quiet for `silenceMs` (default 2000ms) → stop recording
 *  5. Send to Deepgram nova-2 → return transcript via callback
 *
 * RMS-based VAD is what production voice apps use (Vapi, ElevenLabs, Whisper Web).
 * Frequency-domain analysis (what we tried before) is too sensitive to background noise.
 */

import { useRef, useCallback, useState } from 'react'

export type STTStatus = 'idle' | 'recording' | 'processing' | 'error'

interface UseDeepgramSTTOptions {
  onTranscript: (text: string, isFinal: boolean) => void
  onError?: (err: string) => void
  silenceMs?: number          // ms of silence after speech before auto-stop
  maxWaitForSpeechMs?: number // max ms to wait for user to start speaking
  maxRecordingMs?: number     // hard cap on recording duration
}

// Time-domain RMS thresholds (0-1 scale)
// Speech typically has RMS 0.02-0.15. Background noise sits around 0.005-0.015.
const SPEAKING_THRESHOLD = 0.018  // RMS to detect user started speaking
const SILENCE_THRESHOLD  = 0.010  // RMS below this = silence

export function useDeepgramSTT({
  onTranscript,
  onError,
  silenceMs = 2200,
  maxWaitForSpeechMs = 30000,
  maxRecordingMs = 90000,
}: UseDeepgramSTTOptions) {
  const [status, setStatus] = useState<STTStatus>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRecordingRef = useRef(false)
  const deepgramAvailableRef = useRef<boolean | null>(null)

  // ── Send audio blob to Deepgram ─────────────────────────────────────────
  const transcribeBlob = useCallback(async (blob: Blob): Promise<string> => {
    try {
      const form = new FormData()
      form.append('audio', blob, 'audio.webm')

      const res = await fetch('/api/coach/stt', {
        method: 'POST',
        body: form,
        credentials: 'same-origin',
      })

      if (res.status === 503) { deepgramAvailableRef.current = false; return '' }
      if (!res.ok) { console.warn('[STT] Deepgram returned', res.status); return '' }

      deepgramAvailableRef.current = true
      const data = await res.json()
      return (data.transcript || '').trim()
    } catch (err) {
      console.warn('[STT] Network error', err)
      return ''
    }
  }, [])

  // ── Cleanup ─────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (rafIdRef.current !== null) { cancelAnimationFrame(rafIdRef.current); rafIdRef.current = null }
    if (maxDurationTimerRef.current) { clearTimeout(maxDurationTimerRef.current); maxDurationTimerRef.current = null }
    try { audioContextRef.current?.close() } catch {}
    audioContextRef.current = null
    analyserRef.current = null
  }, [])

  // ── Start recording ─────────────────────────────────────────────────────
  const startRecording = useCallback(async (autoStopOnSilence = true): Promise<boolean> => {
    if (isRecordingRef.current) return false

    if (typeof MediaRecorder === 'undefined') {
      onError?.('MediaRecorder not supported. Use Chrome, Edge, or Firefox.')
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      })

      streamRef.current = stream
      chunksRef.current = []

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
        cleanup()
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null

        if (chunksRef.current.length === 0) {
          setStatus('idle')
          onTranscript('', true)
          return
        }

        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        chunksRef.current = []

        // Tiny recordings (< 1.5KB ≈ <500ms) are noise/clicks — skip
        if (blob.size < 1500) {
          console.log('[STT] Skipping tiny recording', blob.size, 'bytes')
          setStatus('idle')
          onTranscript('', true)
          return
        }

        console.log('[STT] Sending', blob.size, 'bytes to Deepgram')
        setStatus('processing')
        const text = await transcribeBlob(blob)
        console.log('[STT] Transcript:', text || '(empty)')
        setStatus('idle')
        onTranscript(text, true)
      }

      recorder.onerror = (e) => {
        console.error('[STT] Recorder error', e)
        isRecordingRef.current = false
        setStatus('error')
        onError?.('Recording failed')
      }

      // Collect chunks every 250ms — important: must call start with timeslice
      // for ondataavailable to fire periodically
      recorder.start(250)
      isRecordingRef.current = true
      setStatus('recording')

      // ── Voice Activity Detection via time-domain RMS ────────────────────
      if (autoStopOnSilence) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = ctx

        // Resume if suspended (Chrome autoplay policy)
        if (ctx.state === 'suspended') {
          try { await ctx.resume() } catch {}
        }

        const analyser = ctx.createAnalyser()
        analyser.fftSize = 2048  // larger buffer = smoother RMS
        analyserRef.current = analyser

        const source = ctx.createMediaStreamSource(stream)
        source.connect(analyser)

        const buffer = new Float32Array(analyser.fftSize)
        let hasStartedSpeaking = false
        let lastSpeechAt = 0
        let recordingStartedAt = performance.now()
        let stopped = false

        const stopNow = () => {
          if (stopped) return
          stopped = true
          if (rafIdRef.current !== null) { cancelAnimationFrame(rafIdRef.current); rafIdRef.current = null }
          if (isRecordingRef.current) {
            try { recorder.stop() } catch {}
          }
        }

        const tick = () => {
          if (stopped || !analyserRef.current) return

          analyserRef.current.getFloatTimeDomainData(buffer)

          // Compute RMS (root mean square) of time-domain samples
          let sumSquares = 0
          for (let i = 0; i < buffer.length; i++) {
            sumSquares += buffer[i] * buffer[i]
          }
          const rms = Math.sqrt(sumSquares / buffer.length)

          const now = performance.now()
          const elapsedSinceStart = now - recordingStartedAt

          if (rms >= SPEAKING_THRESHOLD) {
            // User is speaking
            if (!hasStartedSpeaking) {
              console.log('[STT] User started speaking (RMS:', rms.toFixed(4), ')')
              hasStartedSpeaking = true
            }
            lastSpeechAt = now
          } else if (rms < SILENCE_THRESHOLD && hasStartedSpeaking) {
            // User has been speaking, but is now quiet — check duration
            const silentFor = now - lastSpeechAt
            if (silentFor >= silenceMs) {
              console.log('[STT] User stopped speaking after', silentFor.toFixed(0), 'ms of silence')
              stopNow()
              return
            }
          } else if (!hasStartedSpeaking && elapsedSinceStart >= maxWaitForSpeechMs) {
            // User never started speaking — give up
            console.log('[STT] No speech detected after', elapsedSinceStart.toFixed(0), 'ms')
            stopNow()
            return
          }

          // Hard cap
          if (elapsedSinceStart >= maxRecordingMs) {
            console.log('[STT] Hit max recording duration')
            stopNow()
            return
          }

          rafIdRef.current = requestAnimationFrame(tick)
        }

        rafIdRef.current = requestAnimationFrame(tick)
      } else {
        // Push-to-talk mode: just hard cap
        maxDurationTimerRef.current = setTimeout(() => {
          if (isRecordingRef.current) {
            try { recorder.stop() } catch {}
          }
        }, maxRecordingMs)
      }

      return true
    } catch (err: any) {
      console.error('[STT] startRecording failed', err)
      setStatus('error')
      onError?.(err?.message || 'Microphone access denied')
      return false
    }
  }, [onTranscript, onError, transcribeBlob, cleanup, silenceMs, maxWaitForSpeechMs, maxRecordingMs])

  // ── Stop recording (manual stop or push-to-talk release) ───────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      try { mediaRecorderRef.current.stop() } catch {}
    }
  }, [])

  // ── Abort (discard audio, don't transcribe) ─────────────────────────────
  const abortRecording = useCallback(() => {
    cleanup()
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
    setStatus('idle')
  }, [cleanup])

  return {
    status,
    isRecording: status === 'recording',
    isProcessing: status === 'processing',
    startRecording,
    stopRecording,
    abortRecording,
    isDeepgramAvailable: deepgramAvailableRef.current !== false,
  }
}
