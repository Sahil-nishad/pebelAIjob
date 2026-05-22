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

export default function MeetInterview({ company, role, sessionType, userName, onClose }: MeetInterviewProps) {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('joining')
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [currentSpeech, setCurrentSpeech] = useState('')
  const [showTranscript, setShowTranscript] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [reportData, setReportData] = useState<any>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<'female' | 'male'>('female')
  const [currentTime, setCurrentTime] = useState('')

  // Camera state
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const screenshotsRef = useRef<string[]>([])
  const screenshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectedVoiceRef = useRef<'female' | 'male'>('female')
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const shouldRestartRef = useRef(false)
  const sessionIdRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // ── Deepgram STT — works identically on desktop and mobile ──────────────
  const deepgramSTT = useDeepgramSTT({
    onTranscript: (text) => {
      if (!shouldRestartRef.current) return
      setCurrentSpeech('')
      if (text) {
        sendToCoach(text)
      } else {
        // No speech detected — restart listening after short pause
        setTimeout(() => {
          if (shouldRestartRef.current) {
            const startFn = (window as any).__pebelStartListening
            if (startFn) startFn()
          }
        }, 300)
      }
    },
    onInterim: (text) => {
      // Live preview as user speaks
      if (shouldRestartRef.current) setCurrentSpeech(text)
    },
    onError: (err) => {
      console.warn('[STT] Error:', err)
    },
    silenceMs: 1200,
    maxWaitForSpeechMs: 25000,
  })

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [transcript])

  // ── Camera ───────────────────────────────────────────────────────────────
  const enableCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      setCameraStream(stream)
      setCameraEnabled(true)
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
    } catch {
      toast.error('Camera access denied. Interview continues without camera.')
    }
  }, [])

  const disableCamera = useCallback(() => {
    cameraStream?.getTracks().forEach(t => t.stop())
    setCameraStream(null)
    setCameraEnabled(false)
    if (screenshotIntervalRef.current) clearInterval(screenshotIntervalRef.current)
  }, [cameraStream])

  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream
      videoRef.current.play().catch(() => {})
    }
  }, [cameraStream])

  useEffect(() => {
    if (cameraEnabled && sessionStatus !== 'joining' && sessionStatus !== 'ended') {
      screenshotIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return
        const canvas = canvasRef.current
        const video = videoRef.current
        canvas.width = 320; canvas.height = 240
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, 320, 240)
          const shot = canvas.toDataURL('image/jpeg', 0.4)
          screenshotsRef.current = [...screenshotsRef.current.slice(-3), shot]
        }
      }, 15000)
    }
    return () => { if (screenshotIntervalRef.current) clearInterval(screenshotIntervalRef.current) }
  }, [cameraEnabled, sessionStatus])

  useEffect(() => {
    return () => { cameraStream?.getTracks().forEach(t => t.stop()) }
  }, [cameraStream])

  // ── Clock & timer ────────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (sessionStatus !== 'joining' && sessionStatus !== 'ended') {
      timerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [sessionStatus])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // ── TTS ──────────────────────────────────────────────────────────────────
  const getBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices()
    const preferred = ['Google UK English Female', 'Samantha', 'Karen', 'Microsoft Zira', 'Google UK English Male']
    for (const name of preferred) {
      const v = voices.find(voice => voice.name.includes(name))
      if (v) return v
    }
    return voices.find(v => v.lang.startsWith('en')) || voices[0] || null
  }, [])

  const startListeningAfterSpeak = useCallback(() => {
    if (!shouldRestartRef.current) return
    setSessionStatus('listening')
    const startFn = (window as any).__pebelStartListening
    if (startFn) startFn()
  }, [])

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      if (isMuted || !shouldRestartRef.current) { resolve(); return }
      setSessionStatus('speaking')
      setAiSpeaking(true)

      const afterSpeak = () => {
        setAiSpeaking(false)
        if (!shouldRestartRef.current) { resolve(); return }
        resolve()
        startListeningAfterSpeak()
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
  }, [isMuted, startListeningAfterSpeak])

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
      if (shouldRestartRef.current) { resolve(); startListeningAfterSpeak() }
      else resolve()
    }
    utterance.onerror = () => { setAiSpeaking(false); resolve() }
    synthRef.current.speak(utterance)
  }, [getBestVoice, startListeningAfterSpeak])

  // ── AI message handler ───────────────────────────────────────────────────
  const sendToCoach = useCallback(async (userMessage: string) => {
    const sid = sessionIdRef.current
    if (!sid || !userMessage.trim()) return
    setTranscript(prev => [...prev, { role: 'You', text: userMessage }])
    setSessionStatus('thinking')
    try {
      const res = await authFetch('/api/coach/voice-message', {
        method: 'POST',
        body: JSON.stringify({ sessionId: sid, message: userMessage }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      const aiMessage = data.message || 'Could you repeat that?'
      setTranscript(prev => [...prev, { role: 'AI Coach', text: aiMessage }])
      await speak(aiMessage)
    } catch {
      toast.error('Failed to get AI response')
      startListeningAfterSpeak()
    }
  }, [speak, startListeningAfterSpeak])

  // ── Session start ────────────────────────────────────────────────────────
  const handleJoin = useCallback(async () => {
    try { const a = new Audio('/sounds/join.mp3'); a.volume = 0.4; await a.play().catch(() => {}) } catch {}
    setSessionStatus('connected')
    await new Promise(r => setTimeout(r, 1500))

    try {
      const res = await authFetch('/api/coach/start', {
        method: 'POST',
        body: JSON.stringify({ company, role, sessionType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      sessionIdRef.current = data.session.id
      shouldRestartRef.current = true

      // Check if Deepgram is configured
      const sttCheck = await fetch('/api/coach/stt', { method: 'HEAD', credentials: 'same-origin' }).catch(() => null)
      const useDeepgram = sttCheck?.status === 200

      if (useDeepgram) {
        // Register the start-listening function — called after AI finishes speaking
        const startDeepgramListening = async () => {
          if (!shouldRestartRef.current) return
          setSessionStatus('listening')
          setCurrentSpeech('')
          const ok = await deepgramSTT.startRecording(true) // always auto-stop on silence
          if (!ok && shouldRestartRef.current) {
            toast.error('Microphone access denied. Please allow mic access and refresh.')
            setSessionStatus('ended')
          }
        }
        ;(window as any).__pebelStartListening = startDeepgramListening
      } else {
        // Web Speech fallback — same auto-listen behavior, no push-to-talk
        setupWebSpeechFallback()
      }

      const introMessage = data.introMessage ||
        `Hello ${userName}! Welcome to your ${sessionType} interview for the ${role} position at ${company}. Let's get started. Tell me about yourself.`
      setTranscript([{ role: 'AI Coach', text: introMessage }])
      speechSynthesis.getVoices()
      await new Promise(r => setTimeout(r, 300))
      await speak(introMessage)

    } catch (err: any) {
      toast.error(err?.message || 'Failed to start interview')
      setSessionStatus('ended')
    }
  }, [company, role, sessionType, userName, speak, deepgramSTT])

  // ── Web Speech fallback (no push-to-talk — auto-listen like Deepgram) ───
  const setupWebSpeechFallback = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { toast.error('Use Chrome or Edge for voice interviews.'); return }

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-IN'

    let accumulated = ''
    let silenceTimer: ReturnType<typeof setTimeout> | null = null
    let hasSpoken = false

    recognition.onresult = (event: any) => {
      let interim = '', final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r[0]) { if (r.isFinal) { final += r[0].transcript + ' ' } else { interim = r[0].transcript } }
      }
      if (final) { accumulated += final; hasSpoken = true }
      setCurrentSpeech((accumulated + interim).trim())
      if (silenceTimer) clearTimeout(silenceTimer)
      if (hasSpoken || interim) {
        silenceTimer = setTimeout(() => {
          if (accumulated.trim()) {
            const msg = accumulated.trim()
            accumulated = ''; hasSpoken = false; setCurrentSpeech('')
            recognition.stop()
            sendToCoach(msg)
          }
        }, 1500)
      }
    }

    recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer)
      if (accumulated.trim()) {
        const msg = accumulated.trim(); accumulated = ''; hasSpoken = false; setCurrentSpeech('')
        sendToCoach(msg)
      } else if (shouldRestartRef.current) {
        setTimeout(() => {
          if (shouldRestartRef.current) {
            try { recognition.start() } catch {}
          }
        }, 300)
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied.')
        setSessionStatus('ended')
      } else if (event.error !== 'aborted' && shouldRestartRef.current) {
        setTimeout(() => { try { recognition.start() } catch {} }, 500)
      }
    }

    ;(window as any).__pebelStartListening = () => {
      if (!shouldRestartRef.current) return
      setSessionStatus('listening')
      setCurrentSpeech('')
      try { recognition.start() } catch {}
    }
  }, [sendToCoach])

  // ── End call ─────────────────────────────────────────────────────────────
  const handleEndCall = useCallback(() => {
    shouldRestartRef.current = false
    sessionIdRef.current = null
    ;(window as any).__pebelStartListening = null
    synthRef.current?.cancel()
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (abortControllerRef.current) { abortControllerRef.current.abort() }
    deepgramSTT.abortRecording()
    setSessionStatus('ended')
    setAiSpeaking(false)
  }, [deepgramSTT])

  // ── Report ───────────────────────────────────────────────────────────────
  const handleGetReport = useCallback(async () => {
    if (transcript.length < 4) { toast.error('Answer at least 2 questions to get a report'); return }
    setGeneratingReport(true)
    disableCamera()
    try {
      const res = await authFetch('/api/coach/report', {
        method: 'POST',
        body: JSON.stringify({
          transcript, company, role, sessionType,
          screenshots: screenshotsRef.current.slice(0, 2),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setReportData(data.report)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate report')
    } finally {
      setGeneratingReport(false)
    }
  }, [transcript, company, role, sessionType, disableCamera])

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false
      ;(window as any).__pebelStartListening = null
      synthRef.current?.cancel()
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
      if (abortControllerRef.current) { abortControllerRef.current.abort() }
      if (timerRef.current) clearInterval(timerRef.current)
      deepgramSTT.abortRecording()
    }
  }, [])

  useEffect(() => { handleJoin() }, [])

  if (typeof document === 'undefined') return null
  if (reportData) return createPortal(
    <InterviewReport report={reportData} company={company} role={role} sessionType={sessionType} onClose={onClose} />,
    document.body
  )

  const userInitial = userName.charAt(0).toUpperCase()

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#f0f4f9] flex flex-col">

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-2 md:py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-[#0A6A47] font-bold text-sm md:text-lg">PebelAI Interview Room</span>
          <span className="text-gray-400 hidden md:inline">|</span>
          <span className="text-gray-500 text-xs md:text-sm hidden md:inline">{currentTime}</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
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

      {/* Video Grid */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-3 md:p-6 gap-3 md:gap-4 overflow-hidden">

        {/* AI Panel */}
        <div className="relative w-full md:flex-1 md:max-w-[580px] h-[40vh] md:h-auto md:aspect-[4/3] rounded-2xl overflow-visible shadow-lg bg-gradient-to-br from-[#f8faf9] to-[#e8f0eb] flex items-center justify-center">
          {(aiSpeaking || sessionStatus === 'thinking') && (
            <>
              <div className="absolute -inset-[3px] rounded-2xl overflow-hidden">
                <div className={`absolute inset-0 rounded-2xl ${aiSpeaking ? 'animate-spin' : ''}`} style={{ animationDuration: '3s', background: 'conic-gradient(from 0deg, #0A6A47, #34d399, #fbbf24, #0A6A47)' }} />
                <div className="absolute inset-[3px] rounded-[14px] bg-gradient-to-br from-[#f8faf9] to-[#e8f0eb]" />
              </div>
              <div className="absolute -inset-[6px] rounded-2xl opacity-40 blur-md" style={{ background: 'conic-gradient(from 0deg, #0A6A47, #34d399, #fbbf24, #0A6A47)' }} />
            </>
          )}
          <div className="relative z-10 flex flex-col items-center gap-3 md:gap-4">
            <div className={`relative w-24 h-24 md:w-36 md:h-36 rounded-full flex items-center justify-center ${aiSpeaking ? 'animate-pulse' : ''}`}>
              <div className={`absolute inset-0 rounded-full border-4 ${aiSpeaking ? 'border-[#0A6A47] animate-spin' : 'border-[#0A6A47]/30'}`} style={{ animationDuration: '3s' }} />
              <div className={`absolute inset-2 rounded-full border-2 ${aiSpeaking ? 'border-[#0A6A47]/60' : 'border-[#0A6A47]/15'}`} />
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white shadow-md flex items-center justify-center">
                <img src="/pebelai-logo.svg" alt="PebelAI" className="w-10 h-10 md:w-16 md:h-16 object-contain" />
              </div>
            </div>
            <span className="text-[#0A6A47] font-bold text-base md:text-lg">PebelAI Interviewer</span>
          </div>
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
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
            <span className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium">PebelAI Interviewer</span>
            <span className="bg-[#0A6A47] p-1 rounded-full"><Volume2 className="w-3 h-3 text-white" /></span>
          </div>
        </div>

        {/* User Panel */}
        <div className="relative w-full md:flex-1 md:max-w-[580px] h-[40vh] md:h-auto md:aspect-[4/3] bg-[#3c4043] rounded-2xl overflow-visible shadow-lg flex items-center justify-center">
          {/* Listening ring */}
          {sessionStatus === 'listening' && !isMuted && (
            <>
              <div className="absolute -inset-[3px] rounded-2xl overflow-hidden">
                <div className="absolute inset-0 rounded-2xl animate-spin" style={{ animationDuration: '3s', background: 'conic-gradient(from 0deg, #3b82f6, #06b6d4, #8b5cf6, #3b82f6)' }} />
                <div className="absolute inset-[3px] rounded-[14px] bg-[#3c4043]" />
              </div>
              <div className="absolute -inset-[6px] rounded-2xl opacity-40 blur-md" style={{ background: 'conic-gradient(from 0deg, #3b82f6, #06b6d4, #8b5cf6, #3b82f6)' }} />
            </>
          )}

          {/* Camera feed */}
          {cameraEnabled && (
            <video ref={videoRef} autoPlay muted playsInline
              className="absolute inset-0 w-full h-full object-cover rounded-2xl z-10" />
          )}
          <canvas ref={canvasRef} className="hidden" />

          {/* Avatar */}
          {!cameraEnabled && (
            <div className="relative z-10 flex flex-col items-center gap-3 md:gap-4">
              <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl md:text-5xl font-bold transition-all ${
                sessionStatus === 'listening' && !isMuted ? 'ring-4 ring-blue-400/50 scale-105' : ''
              }`}>
                {userInitial}
              </div>
              {/* Live transcript preview */}
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
                <p className="text-gray-400 text-sm animate-pulse">Listening...</p>
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
              <span className="bg-[#0A6A47] p-1 rounded-full"><Mic className="w-3 h-3 text-white" /></span>
            )}
            {isMuted && (
              <span className="bg-red-500 p-1 rounded-full"><MicOff className="w-3 h-3 text-white" /></span>
            )}
          </div>
        </div>
      </div>

      {/* Joining Overlay */}
      <AnimatePresence>
        {sessionStatus === 'joining' && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#f0f4f9] flex flex-col items-center justify-center z-10">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#f0f4f9] flex flex-col items-center justify-center z-10">
            <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center gap-4">
              <Phone className="w-12 h-12 text-red-400" />
              <p className="text-xl font-semibold text-gray-900">Interview Ended</p>
              <p className="text-gray-500 text-sm">Duration: {formatTime(elapsedTime)}</p>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={handleGetReport} disabled={generatingReport || transcript.length < 4}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0A6A47] text-white rounded-full font-semibold hover:bg-[#085c3d] transition-colors disabled:opacity-50">
                  {generatingReport
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
                    : <><FileText className="w-5 h-5" /> Get Report</>}
                </button>
                <button onClick={onClose}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls — same on all devices */}
      {sessionStatus !== 'joining' && sessionStatus !== 'ended' && (
        <div className="flex items-center justify-center gap-3 py-4 px-4 bg-white border-t border-gray-200">
          {/* Mute */}
          <button onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={() => cameraEnabled ? disableCamera() : enableCamera()}
            title={cameraEnabled ? 'Turn off camera' : 'Enable camera for body language analysis'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              cameraEnabled ? 'bg-[#0A6A47] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Transcript */}
          <button onClick={() => setShowTranscript(!showTranscript)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              showTranscript ? 'bg-[#0A6A47] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
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
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-white flex flex-col z-20 shadow-2xl border-l border-gray-200">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-800">Live Transcript</h3>
              <button onClick={() => setShowTranscript(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcript.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'You' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'You' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-800'
                  }`}>
                    <span className="block text-[10px] font-bold text-gray-500 mb-1">
                      {msg.role === 'You' ? userName : 'PebelAI'}
                    </span>
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
