'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Phone, MessageSquare, Volume2,
  Loader2, FileText, Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authFetch } from '@/lib/api'
import InterviewReport from './InterviewReport'
import { useDeepgramSTT } from '@/lib/useDeepgramSTT'

interface MeetInterviewProps {
  company: string
  role: string
  sessionType: string
  userName: string
  onClose: () => void
}

type SessionStatus = 'joining' | 'connected' | 'listening' | 'thinking' | 'speaking' | 'ended'

function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export default function MeetInterview({ company, role, sessionType, userName, onClose }: MeetInterviewProps) {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('joining')
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [currentSpeech, setCurrentSpeech] = useState('')
  const [showTranscript, setShowTranscript] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [reportData, setReportData] = useState<any>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isPushToTalkHeld, setIsPushToTalkHeld] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<'female' | 'male'>('female')
  const selectedVoiceRef = useRef<'female' | 'male'>('female')
  const [currentTime, setCurrentTime] = useState('')

  // Camera state
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const screenshotsRef = useRef<string[]>([]) // base64 screenshots
  const screenshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const isListeningRef = useRef(false)
  const shouldRestartRef = useRef(false)
  const sessionIdRef = useRef<string | null>(null)
  const isPushToTalkHeldRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  // Deepgram STT — used when available; falls back to Web Speech API
  const deepgramSTT = useDeepgramSTT({
    onTranscript: (text) => {
      if (text && shouldRestartRef.current) {
        setCurrentSpeech('')
        sendToCoach(text)
      }
    },
    onError: (err) => {
      console.warn('[STT] Deepgram error:', err)
      // Fall back to Web Speech API silently
    },
    silenceMs: 2000,
  })

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [transcript])
  useEffect(() => { setIsMobile(isMobileBrowser()) }, [])

  // Camera functions
  const enableCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      setCameraStream(stream)
      setCameraEnabled(true)
      setCameraError(false)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (e) {
      setCameraError(true)
      toast.error('Camera access denied. Interview will continue without camera.')
    }
  }, [])

  const disableCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop())
      setCameraStream(null)
    }
    setCameraEnabled(false)
    if (screenshotIntervalRef.current) clearInterval(screenshotIntervalRef.current)
  }, [cameraStream])

  // Attach stream to video element when it becomes available
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream
      videoRef.current.play().catch(() => {})
    }
  }, [cameraStream])

  // Start capturing screenshots every 10s when interview is active
  useEffect(() => {
    if (cameraEnabled && sessionStatus !== 'joining' && sessionStatus !== 'ended') {
      screenshotIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return
        const canvas = canvasRef.current
        const video = videoRef.current
        canvas.width = 320
        canvas.height = 240
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, 320, 240)
          const screenshot = canvas.toDataURL('image/jpeg', 0.5)
          // Keep max 12 screenshots (2 min of interview)
          screenshotsRef.current = [...screenshotsRef.current.slice(-11), screenshot]
        }
      }, 10000)
    }
    return () => {
      if (screenshotIntervalRef.current) clearInterval(screenshotIntervalRef.current)
    }
  }, [cameraEnabled, sessionStatus])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop())
      if (screenshotIntervalRef.current) clearInterval(screenshotIntervalRef.current)
    }
  }, [cameraStream])

  // Current time display
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  // Timer
  useEffect(() => {
    if (sessionStatus !== 'joining' && sessionStatus !== 'ended') {
      timerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [sessionStatus])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // Get best voice
  const getBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices()
    const preferred = ['Google UK English Female', 'Samantha', 'Karen', 'Microsoft Zira', 'Google UK English Male']
    for (const name of preferred) {
      const v = voices.find(voice => voice.name.includes(name))
      if (v) return v
    }
    return voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) || voices.find(v => v.lang.startsWith('en')) || voices[0] || null
  }, [])

  // Speak text
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      if (isMuted || !shouldRestartRef.current) { resolve(); return }
      setSessionStatus('speaking')
      setAiSpeaking(true)

      const afterSpeak = () => {
        setAiSpeaking(false)
        if (!shouldRestartRef.current) { resolve(); return }
        setSessionStatus('listening')
        resolve()
        // Resume listening — use Deepgram if available, else Web Speech
        const startFn = (window as any).__pebelStartListening
        if (startFn) {
          startFn()
        } else if (!isMobileBrowser()) {
          startListening()
        }
      }

      try {
        abortControllerRef.current = new AbortController()
        const res = await fetch('/api/coach/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ text: text.slice(0, 800), voice: selectedVoiceRef.current === 'male' ? 'orion' : 'athena' }),
          signal: abortControllerRef.current.signal,
        })
        if (res.ok && res.headers.get('content-type')?.includes('audio')) {
          const audioBlob = await res.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          audioRef.current = audio
          audio.onended = () => { URL.revokeObjectURL(audioUrl); audioRef.current = null; afterSpeak() }
          audio.onerror = () => { URL.revokeObjectURL(audioUrl); audioRef.current = null; speakBrowser(text, resolve) }
          audio.play().catch(() => speakBrowser(text, resolve))
          return
        }
      } catch (e: any) { if (e?.name === 'AbortError') { resolve(); return } }
      speakBrowser(text, resolve)
    })
  }, [isMuted, startListening])

  const speakBrowser = useCallback((text: string, resolve: () => void) => {
    synthRef.current = window.speechSynthesis
    if (!synthRef.current || !shouldRestartRef.current) { resolve(); return }
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = getBestVoice()
    if (voice) utterance.voice = voice
    utterance.rate = 0.9; utterance.pitch = 1.0
    utterance.onend = () => {
      setAiSpeaking(false)
      if (shouldRestartRef.current) {
        setSessionStatus('listening')
        resolve()
        const startFn = (window as any).__pebelStartListening
        if (startFn) startFn()
        else if (!isMobileBrowser()) startListening()
      } else resolve()
    }
    utterance.onerror = () => { setAiSpeaking(false); resolve() }
    synthRef.current.speak(utterance)
  }, [getBestVoice, startListening])

  const sendToCoach = useCallback(async (userMessage: string) => {
    const currentSessionId = sessionIdRef.current
    if (!currentSessionId || !userMessage.trim()) return
    setTranscript(prev => [...prev, { role: 'You', text: userMessage }])
    setSessionStatus('thinking')
    try {
      const res = await authFetch('/api/coach/voice-message', { method: 'POST', body: JSON.stringify({ sessionId: currentSessionId, message: userMessage }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      const aiMessage = data.message || 'Could you repeat that?'
      setTranscript(prev => [...prev, { role: 'AI Coach', text: aiMessage }])
      await speak(aiMessage)
    } catch { toast.error('Failed to get AI response'); setSessionStatus('listening'); if (!isMobileBrowser()) startListening() }
  }, [speak])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current || !shouldRestartRef.current) return
    try { isListeningRef.current = true; setSessionStatus('listening'); setCurrentSpeech(''); recognitionRef.current.start() }
    catch { isListeningRef.current = false; if (shouldRestartRef.current) setTimeout(() => startListening(), 500) }
  }, [])

  const handlePushToTalkStart = useCallback(() => {
    if (!recognitionRef.current || !sessionIdRef.current || isListeningRef.current) return
    isPushToTalkHeldRef.current = true; setIsPushToTalkHeld(true); setCurrentSpeech('')
    try { isListeningRef.current = true; setSessionStatus('listening'); recognitionRef.current.start() }
    catch { isListeningRef.current = false; isPushToTalkHeldRef.current = false; setIsPushToTalkHeld(false) }
  }, [])

  const handlePushToTalkEnd = useCallback(() => {
    isPushToTalkHeldRef.current = false; setIsPushToTalkHeld(false)
    if (isListeningRef.current) { isListeningRef.current = false; try { recognitionRef.current?.stop() } catch {} }
  }, [])

  // Start session
  const handleJoin = useCallback(async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    try { const joinAudio = new Audio('/sounds/join.mp3'); joinAudio.volume = 0.4; await joinAudio.play().catch(() => {}) } catch {}
    setSessionStatus('connected')
    await new Promise(r => setTimeout(r, 2000))

    try {
      const res = await authFetch('/api/coach/start', { method: 'POST', body: JSON.stringify({ company, role, sessionType }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setSessionId(data.session.id); sessionIdRef.current = data.session.id

      shouldRestartRef.current = true

      // ── Try Deepgram STT first (much better accuracy) ──────────────────
      // Test if Deepgram is available by checking if the key is configured
      const sttTest = await fetch('/api/coach/stt', {
        method: 'POST',
        body: (() => { const f = new FormData(); f.append('audio', new Blob([''], { type: 'audio/webm' }), 'test.webm'); return f })(),
        credentials: 'same-origin',
      }).catch(() => null)

      const useDeepgram = sttTest && sttTest.status !== 503

      if (useDeepgram) {
        // ── Deepgram STT mode ──────────────────────────────────────────────
        const mobile = isMobileBrowser()

        const startDeepgramListening = async () => {
          if (!shouldRestartRef.current) return
          setSessionStatus('listening')
          setCurrentSpeech('Listening...')
          const ok = await deepgramSTT.startRecording(!mobile) // auto-stop on silence for desktop
          if (!ok && shouldRestartRef.current) {
            // Mic denied — fall back to Web Speech
            setupWebSpeech()
          }
        }

        // Store startDeepgramListening so speak() can call it after AI finishes
        ;(window as any).__pebelStartListening = startDeepgramListening

        const introMessage = data.introMessage || `Hello ${userName}! Welcome to your ${sessionType} interview for the ${role} position at ${company}. Let's get started. Tell me about yourself.`
        setTranscript([{ role: 'AI Coach', text: introMessage }])
        await speak(introMessage)
        if (mobile) setSessionStatus('listening')
        return
      }

      // ── Fallback: Web Speech API ───────────────────────────────────────
      setupWebSpeech()

      const introMessage = data.introMessage || `Hello ${userName}! Welcome to your ${sessionType} interview for the ${role} position at ${company}. Let's get started. Tell me about yourself.`
      setTranscript([{ role: 'AI Coach', text: introMessage }])
      speechSynthesis.getVoices(); await new Promise(r => setTimeout(r, 500))
      await speak(introMessage)
      if (isMobileBrowser()) setSessionStatus('listening')

    } catch (err: any) { toast.error(err?.message || 'Failed to start'); setSessionStatus('ended') }
  }, [company, role, sessionType, userName, speak, sendToCoach, startListening, deepgramSTT])

  // ── Web Speech API setup (fallback) ─────────────────────────────────────
  const setupWebSpeech = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { toast.error('Use Chrome or Edge for speech recognition.'); return }

    const recognition = new SpeechRecognition()
    const mobile = isMobileBrowser()
    recognition.continuous = !mobile; recognition.interimResults = true; recognition.lang = 'en-IN'

    let accumulatedTranscript = ''; let silenceTimer: ReturnType<typeof setTimeout> | null = null; let hasSpoken = false

    recognition.onresult = (event: any) => {
      let interim = ''; let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result[0]) { if (result.isFinal) final += result[0].transcript + ' '; else interim = result[0].transcript }
      }
      if (final) { accumulatedTranscript += final; hasSpoken = true }
      setCurrentSpeech(accumulatedTranscript + interim)
      if (mobile) return
      if (silenceTimer) clearTimeout(silenceTimer)
      if (hasSpoken || interim) {
        silenceTimer = setTimeout(() => {
          if (accumulatedTranscript.trim()) {
            const message = accumulatedTranscript.trim(); accumulatedTranscript = ''; hasSpoken = false; setCurrentSpeech('')
            recognition.stop(); isListeningRef.current = false; sendToCoach(message)
          }
        }, 2500)
      }
    }

    recognition.onend = () => {
      isListeningRef.current = false; if (silenceTimer) clearTimeout(silenceTimer)
      if (mobile) {
        if (isPushToTalkHeldRef.current && shouldRestartRef.current) {
          setTimeout(() => {
            if (isPushToTalkHeldRef.current && shouldRestartRef.current) {
              try { isListeningRef.current = true; recognition.start() }
              catch { isListeningRef.current = false }
            }
          }, 100)
          return
        }
        if (accumulatedTranscript.trim()) { const msg = accumulatedTranscript.trim(); accumulatedTranscript = ''; hasSpoken = false; setCurrentSpeech(''); sendToCoach(msg) }
        else if (shouldRestartRef.current) { setSessionStatus('listening'); setCurrentSpeech('') }
      } else {
        if (accumulatedTranscript.trim()) { const msg = accumulatedTranscript.trim(); accumulatedTranscript = ''; hasSpoken = false; setCurrentSpeech(''); sendToCoach(msg) }
        else if (shouldRestartRef.current) setTimeout(() => startListening(), 300)
      }
    }

    recognition.onerror = (event: any) => {
      isListeningRef.current = false
      if (event.error === 'not-allowed') { toast.error('Microphone access denied.'); setSessionStatus('ended') }
      else if (event.error === 'no-speech' && mobile && isPushToTalkHeldRef.current) {
        setTimeout(() => {
          if (isPushToTalkHeldRef.current && shouldRestartRef.current) {
            try { isListeningRef.current = true; recognition.start() }
            catch { isListeningRef.current = false }
          }
        }, 100)
      }
      else if (event.error !== 'aborted' && shouldRestartRef.current && !mobile) setTimeout(() => startListening(), 500)
    }

    recognitionRef.current = recognition
  }, [sendToCoach, startListening])

  const handleEndCall = useCallback(() => {
    shouldRestartRef.current = false; isListeningRef.current = false; sessionIdRef.current = null
    ;(window as any).__pebelStartListening = null
    try { recognitionRef.current?.abort() } catch {}
    synthRef.current?.cancel()
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (abortControllerRef.current) { abortControllerRef.current.abort() }
    deepgramSTT.abortRecording()
    setSessionStatus('ended'); setAiSpeaking(false)
  }, [deepgramSTT])

  const handleGetReport = useCallback(async () => {
    if (transcript.length < 4) { toast.error('Answer at least 2 questions to get a report'); return }
    setGeneratingReport(true)
    // Stop camera before generating report
    disableCamera()
    try {
      const res = await authFetch('/api/coach/report', {
        method: 'POST',
        body: JSON.stringify({
          transcript,
          company,
          role,
          sessionType,
          screenshots: screenshotsRef.current.slice(0, 6), // max 6 screenshots
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setReportData(data.report)
    } catch (err: any) { toast.error(err?.message || 'Failed to generate report') }
    finally { setGeneratingReport(false) }
  }, [transcript, company, role, sessionType, disableCamera])

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false
      ;(window as any).__pebelStartListening = null
      try { recognitionRef.current?.abort() } catch {}
      synthRef.current?.cancel()
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
      if (abortControllerRef.current) { abortControllerRef.current.abort() }
      if (timerRef.current) clearInterval(timerRef.current)
      deepgramSTT.abortRecording()
    }
  }, [])

  useEffect(() => { handleJoin() }, [])

  if (typeof document === 'undefined') return null
  if (reportData) return createPortal(<InterviewReport report={reportData} company={company} role={role} sessionType={sessionType} onClose={onClose} />, document.body)

  const userInitial = userName.charAt(0).toUpperCase()

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#f0f4f9] flex flex-col">

      {/* Top Bar — Light theme */}
      <div className="flex items-center justify-between px-4 md:px-6 py-2 md:py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-[#0A6A47] font-bold text-sm md:text-lg">PebelAI Interview Room</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500 text-xs md:text-sm">{currentTime}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-sm font-mono font-medium text-gray-700">{formatTime(elapsedTime)}</span>
          </div>
          <button
            onClick={() => { const next = selectedVoice === 'female' ? 'male' : 'female'; setSelectedVoice(next); selectedVoiceRef.current = next }}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
          >
            <span className="text-xs font-medium text-gray-600">
              {selectedVoice === 'female' ? '♀ Female' : '♂ Male'}
            </span>
          </button>
          <div className="w-8 h-8 rounded-full bg-[#0A6A47] flex items-center justify-center text-white text-sm font-bold">
            {userInitial}
          </div>
        </div>
      </div>

      {/* Main Video Grid */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-3 md:p-6 gap-3 md:gap-4 overflow-hidden">

        {/* AI Interviewer Panel — PebelAI Logo with ring */}
        <div className={`relative w-full md:flex-1 md:max-w-[580px] h-[40vh] md:h-auto md:aspect-[4/3] rounded-2xl overflow-visible shadow-lg bg-gradient-to-br from-[#f8faf9] to-[#e8f0eb] flex items-center justify-center`}>
          {/* Animated gradient ring glow */}
          {(aiSpeaking || sessionStatus === 'thinking') && (
            <div className="absolute -inset-[3px] rounded-2xl overflow-hidden">
              <div className={`absolute inset-0 rounded-2xl ${aiSpeaking ? 'animate-spin' : ''}`} style={{ animationDuration: '3s', background: 'conic-gradient(from 0deg, #0A6A47, #34d399, #fbbf24, #0A6A47)' }} />
              <div className="absolute inset-[3px] rounded-[14px] bg-gradient-to-br from-[#f8faf9] to-[#e8f0eb]" />
            </div>
          )}
          {(aiSpeaking || sessionStatus === 'thinking') && (
            <div className="absolute -inset-[6px] rounded-2xl opacity-40 blur-md" style={{ background: 'conic-gradient(from 0deg, #0A6A47, #34d399, #fbbf24, #0A6A47)' }} />
          )}
          {/* Animated ring + logo */}
          <div className="relative z-10 flex flex-col items-center gap-3 md:gap-4">
            <div className={`relative w-24 h-24 md:w-36 md:h-36 rounded-full flex items-center justify-center ${aiSpeaking ? 'animate-pulse' : ''}`}>
              {/* Outer ring */}
              <div className={`absolute inset-0 rounded-full border-4 ${aiSpeaking ? 'border-[#0A6A47] animate-spin' : 'border-[#0A6A47]/30'}`} style={{ animationDuration: '3s' }} />
              {/* Inner ring */}
              <div className={`absolute inset-2 rounded-full border-2 ${aiSpeaking ? 'border-[#0A6A47]/60' : 'border-[#0A6A47]/15'}`} />
              {/* Logo center */}
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white shadow-md flex items-center justify-center">
                <img src="/pebelai-logo.svg" alt="PebelAI" className="w-10 h-10 md:w-16 md:h-16 object-contain" />
              </div>
            </div>
            <span className="text-[#0A6A47] font-bold text-base md:text-lg">PebelAI Interviewer</span>
          </div>
          {/* Speaking indicator */}
          {aiSpeaking && (
            <div className="absolute top-4 right-4 z-10 bg-green-500 px-3 py-1 rounded-full flex items-center gap-2">
              <Volume2 className="w-3 h-3 text-white" />
              <span className="text-white text-xs font-medium">Speaking</span>
            </div>
          )}
          {sessionStatus === 'thinking' && (
            <div className="absolute top-4 right-4 z-10 bg-yellow-500 px-3 py-1 rounded-full flex items-center gap-2">
              <Loader2 className="w-3 h-3 text-white animate-spin" />
              <span className="text-white text-xs font-medium">Thinking</span>
            </div>
          )}
          {/* Name tag */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
            <span className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium">
              PebelAI Interviewer
            </span>
            <span className="bg-[#0A6A47] p-1 rounded-full">
              <Volume2 className="w-3 h-3 text-white" />
            </span>
          </div>
        </div>

        {/* User Panel */}
        <div className="relative w-full md:flex-1 md:max-w-[580px] h-[40vh] md:h-auto md:aspect-[4/3] bg-[#3c4043] rounded-2xl overflow-visible shadow-lg flex items-center justify-center">
          {/* Animated gradient ring glow when user is speaking */}
          {sessionStatus === 'listening' && !isMuted && (
            <div className="absolute -inset-[3px] rounded-2xl overflow-hidden">
              <div className="absolute inset-0 rounded-2xl animate-spin" style={{ animationDuration: '3s', background: 'conic-gradient(from 0deg, #3b82f6, #06b6d4, #8b5cf6, #3b82f6)' }} />
              <div className="absolute inset-[3px] rounded-[14px] bg-[#3c4043]" />
            </div>
          )}
          {sessionStatus === 'listening' && !isMuted && (
            <div className="absolute -inset-[6px] rounded-2xl opacity-40 blur-md" style={{ background: 'conic-gradient(from 0deg, #3b82f6, #06b6d4, #8b5cf6, #3b82f6)' }} />
          )}

          {/* Camera feed (when enabled) */}
          {cameraEnabled && (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover rounded-2xl z-10"
            />
          )}

          {/* Hidden canvas for screenshots */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Avatar (shown when camera is off) */}
          {!cameraEnabled && (
            <div className="relative z-10 flex flex-col items-center gap-3 md:gap-4">
              <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl md:text-5xl font-bold transition-all ${
                sessionStatus === 'listening' && !isMuted ? 'ring-4 ring-blue-400/50 scale-105' : ''
              }`}>
                {userInitial}
              </div>
              {deepgramSTT.isProcessing && (
                <p className="text-gray-300 text-sm bg-black/30 px-4 py-2 rounded-lg flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Transcribing...
                </p>
              )}
              {currentSpeech && !deepgramSTT.isProcessing && (
                <p className="text-gray-300 text-sm max-w-[80%] text-center line-clamp-2 bg-black/30 px-4 py-2 rounded-lg">
                  {currentSpeech}
                </p>
              )}
              {sessionStatus === 'listening' && !currentSpeech && !deepgramSTT.isProcessing && (
                <p className="text-gray-400 text-sm">
                  {isMobile ? (isPushToTalkHeld ? 'Listening...' : 'Hold mic to speak') : 'Listening...'}
                </p>
              )}
            </div>
          )}

          {/* Camera speech overlay */}
          {cameraEnabled && currentSpeech && (
            <div className="absolute bottom-16 left-4 right-4 z-20">
              <p className="text-white text-sm bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg text-center line-clamp-2">
                {currentSpeech}
              </p>
            </div>
          )}
          {/* Name tag */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
            <span className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium">
              {userName} (You)
            </span>
            {!isMuted && sessionStatus === 'listening' && (
              <span className="bg-[#0A6A47] p-1 rounded-full">
                <Mic className="w-3 h-3 text-white" />
              </span>
            )}
            {isMuted && (
              <span className="bg-red-500 p-1 rounded-full">
                <MicOff className="w-3 h-3 text-white" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Joining Overlay */}
      <AnimatePresence>
        {sessionStatus === 'joining' && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#f0f4f9] flex flex-col items-center justify-center z-10">
            <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-[#0A6A47] animate-spin" />
              <p className="text-xl font-semibold text-gray-900">Joining interview...</p>
              <p className="text-gray-500 text-sm">{company} — {role}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ended Overlay */}
      <AnimatePresence>
        {sessionStatus === 'ended' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-[#f0f4f9] flex flex-col items-center justify-center z-10 gap-4">
            <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center gap-4">
              <Phone className="w-12 h-12 text-red-400" />
              <p className="text-xl font-semibold text-gray-900">Interview Ended</p>
              <p className="text-gray-500 text-sm">Duration: {formatTime(elapsedTime)}</p>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={handleGetReport} disabled={generatingReport || transcript.length < 4}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0A6A47] text-white rounded-full font-semibold hover:bg-[#085c3d] transition-colors disabled:opacity-50">
                  {generatingReport ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><FileText className="w-5 h-5" /> Get Report</>}
                </button>
                <button onClick={onClose} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors">Close</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      {sessionStatus !== 'joining' && sessionStatus !== 'ended' && (
        <div className="flex items-center justify-center gap-3 py-4 px-4 bg-white border-t border-gray-200">
          {/* Mute */}
          <button onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera toggle */}
          <button
            onClick={() => cameraEnabled ? disableCamera() : enableCamera()}
            title={cameraEnabled ? 'Turn off camera' : 'Enable camera for body language analysis'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              cameraEnabled ? 'bg-[#0A6A47] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            {cameraEnabled ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          {/* Push to talk (mobile) */}
          {isMobile && (
            <button
              onTouchStart={e => { e.preventDefault(); handlePushToTalkStart() }}
              onTouchEnd={e => { e.preventDefault(); handlePushToTalkEnd() }}
              onTouchCancel={e => { e.preventDefault(); handlePushToTalkEnd() }}
              onContextMenu={e => e.preventDefault()}
              disabled={sessionStatus === 'thinking' || sessionStatus === 'speaking'}
              style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
              className={`h-12 px-5 rounded-full font-semibold text-sm flex items-center gap-2 transition-all ${
                isPushToTalkHeld
                  ? 'bg-blue-500 text-white scale-105 shadow-lg'
                  : 'bg-[#0A6A47] text-white hover:bg-[#085c3d]'
              } disabled:opacity-50 disabled:scale-100`}>
              <Mic className={`w-4 h-4 ${isPushToTalkHeld ? 'animate-pulse' : ''}`} />
              {isPushToTalkHeld ? 'Recording...' : 'Hold to Speak'}
            </button>
          )}

          {/* Transcript */}
          <button onClick={() => setShowTranscript(!showTranscript)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${showTranscript ? 'bg-[#0A6A47] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Leave */}
          <button onClick={handleEndCall}
            className="h-12 px-6 bg-red-500 text-white rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-red-600 transition-colors">
            <Phone className="w-4 h-4 rotate-[135deg]" />
            Leave
          </button>
        </div>
      )}

      {/* Transcript Panel */}
      <AnimatePresence>
        {showTranscript && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-white flex flex-col z-20 shadow-2xl border-l border-gray-200">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-800">Live Transcript</h3>
              <button onClick={() => setShowTranscript(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcript.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'You' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${msg.role === 'You' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-800'}`}>
                    <span className="block text-[10px] font-bold text-gray-500 mb-1">{msg.role === 'You' ? userName : 'PebelAI'}</span>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  )
}
