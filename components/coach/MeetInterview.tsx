'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Phone, MessageSquare, Volume2, VolumeX,
  Loader2, FileText, MoreVertical, Clock, Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authFetch } from '@/lib/api'
import InterviewReport from './InterviewReport'

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
  const [showChat, setShowChat] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [reportData, setReportData] = useState<any>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isPushToTalkHeld, setIsPushToTalkHeld] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)

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

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [transcript])
  useEffect(() => { setIsMobile(isMobileBrowser()) }, [])

  // Timer
  useEffect(() => {
    if (sessionStatus !== 'joining' && sessionStatus !== 'ended') {
      timerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [sessionStatus])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // Get best voice
  const getBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices()
    const preferred = ['Google UK English Female', 'Google UK English Male', 'Samantha', 'Karen', 'Daniel']
    for (const name of preferred) {
      const v = voices.find(voice => voice.name.includes(name))
      if (v) return v
    }
    return voices.find(v => v.lang.startsWith('en')) || voices[0] || null
  }, [])

  // Speak text
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      if (isMuted || !shouldRestartRef.current) { resolve(); return }
      setSessionStatus('speaking')
      setAiSpeaking(true)

      // Try Deepgram TTS first
      try {
        abortControllerRef.current = new AbortController()
        const res = await fetch('/api/coach/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ text: text.slice(0, 800) }),
          signal: abortControllerRef.current.signal,
        })
        if (res.ok && res.headers.get('content-type')?.includes('audio')) {
          const audioBlob = await res.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          audioRef.current = audio
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl)
            audioRef.current = null
            setAiSpeaking(false)
            if (shouldRestartRef.current) {
              setSessionStatus('listening')
              resolve()
              if (!isMobileBrowser()) startListening()
            } else { resolve() }
          }
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl)
            audioRef.current = null
            speakBrowser(text, resolve)
          }
          audio.play().catch(() => speakBrowser(text, resolve))
          return
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') { resolve(); return }
      }

      speakBrowser(text, resolve)
    })
  }, [isMuted])

  const speakBrowser = useCallback((text: string, resolve: () => void) => {
    synthRef.current = window.speechSynthesis
    if (!synthRef.current || !shouldRestartRef.current) { resolve(); return }
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = getBestVoice()
    if (voice) utterance.voice = voice
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.onend = () => {
      setAiSpeaking(false)
      if (shouldRestartRef.current) {
        setSessionStatus('listening')
        resolve()
        if (!isMobileBrowser()) startListening()
      } else { resolve() }
    }
    utterance.onerror = () => { setAiSpeaking(false); resolve() }
    synthRef.current.speak(utterance)
  }, [getBestVoice])

  // Send to coach
  const sendToCoach = useCallback(async (userMessage: string) => {
    const currentSessionId = sessionIdRef.current
    if (!currentSessionId || !userMessage.trim()) return
    setTranscript(prev => [...prev, { role: 'You', text: userMessage }])
    setSessionStatus('thinking')
    try {
      const res = await authFetch('/api/coach/voice-message', {
        method: 'POST',
        body: JSON.stringify({ sessionId: currentSessionId, message: userMessage }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      const aiMessage = data.message || 'Could you repeat that?'
      setTranscript(prev => [...prev, { role: 'AI Coach', text: aiMessage }])
      await speak(aiMessage)
    } catch {
      toast.error('Failed to get AI response')
      setSessionStatus('listening')
      if (!isMobileBrowser()) startListening()
    }
  }, [speak])

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return
    if (!shouldRestartRef.current) return
    try {
      isListeningRef.current = true
      setSessionStatus('listening')
      setCurrentSpeech('')
      recognitionRef.current.start()
    } catch {
      isListeningRef.current = false
      if (shouldRestartRef.current) setTimeout(() => startListening(), 500)
    }
  }, [])

  // Push to talk
  const handlePushToTalkStart = useCallback(() => {
    if (!recognitionRef.current || !sessionIdRef.current) return
    if (isListeningRef.current) return
    isPushToTalkHeldRef.current = true
    setIsPushToTalkHeld(true)
    setCurrentSpeech('')
    try {
      isListeningRef.current = true
      setSessionStatus('listening')
      recognitionRef.current.start()
    } catch {
      isListeningRef.current = false
      isPushToTalkHeldRef.current = false
      setIsPushToTalkHeld(false)
    }
  }, [])

  const handlePushToTalkEnd = useCallback(() => {
    isPushToTalkHeldRef.current = false
    setIsPushToTalkHeld(false)
    if (isListeningRef.current) {
      isListeningRef.current = false
      try { recognitionRef.current?.stop() } catch {}
    }
  }, [])

  // Play join sound and start session
  const handleJoin = useCallback(async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Your browser does not support speech recognition. Use Chrome or Edge.')
      return
    }

    // Play join sound
    try {
      const joinAudio = new Audio('/sounds/join.mp3')
      joinAudio.volume = 0.5
      await joinAudio.play().catch(() => {})
    } catch {}

    setSessionStatus('connected')

    // Wait a moment for the "joining" feel
    await new Promise(r => setTimeout(r, 1500))

    try {
      const res = await authFetch('/api/coach/start', {
        method: 'POST',
        body: JSON.stringify({ company, role, sessionType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setSessionId(data.session.id)
      sessionIdRef.current = data.session.id

      // Setup recognition
      const recognition = new SpeechRecognition()
      const mobile = isMobileBrowser()
      recognition.continuous = !mobile
      recognition.interimResults = true
      recognition.lang = 'en-US'

      let accumulatedTranscript = ''
      let silenceTimer: ReturnType<typeof setTimeout> | null = null
      let hasSpoken = false

      recognition.onresult = (event: any) => {
        let interim = ''
        let final = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result[0]) {
            if (result.isFinal) final += result[0].transcript + ' '
            else interim = result[0].transcript
          }
        }
        if (final) { accumulatedTranscript += final; hasSpoken = true }
        setCurrentSpeech(accumulatedTranscript + interim)

        if (mobile) return
        if (silenceTimer) clearTimeout(silenceTimer)
        if (hasSpoken || interim) {
          silenceTimer = setTimeout(() => {
            if (accumulatedTranscript.trim()) {
              const message = accumulatedTranscript.trim()
              accumulatedTranscript = ''; hasSpoken = false
              setCurrentSpeech('')
              recognition.stop()
              isListeningRef.current = false
              sendToCoach(message)
            }
          }, 3500)
        }
      }

      recognition.onend = () => {
        isListeningRef.current = false
        if (silenceTimer) clearTimeout(silenceTimer)
        if (mobile) {
          if (isPushToTalkHeldRef.current && shouldRestartRef.current) {
            try { isListeningRef.current = true; recognition.start() } catch { isListeningRef.current = false }
            return
          }
          if (accumulatedTranscript.trim()) {
            const message = accumulatedTranscript.trim()
            accumulatedTranscript = ''; hasSpoken = false; setCurrentSpeech('')
            sendToCoach(message)
          } else if (shouldRestartRef.current) { setSessionStatus('listening'); setCurrentSpeech('') }
        } else {
          if (accumulatedTranscript.trim()) {
            const message = accumulatedTranscript.trim()
            accumulatedTranscript = ''; hasSpoken = false; setCurrentSpeech('')
            sendToCoach(message)
          } else if (shouldRestartRef.current) { setTimeout(() => startListening(), 300) }
        }
      }

      recognition.onerror = (event: any) => {
        isListeningRef.current = false
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied.')
          setSessionStatus('ended')
        } else if (event.error !== 'aborted' && shouldRestartRef.current) {
          if (!mobile) setTimeout(() => startListening(), 500)
        }
      }

      recognitionRef.current = recognition
      shouldRestartRef.current = true

      const introMessage = data.introMessage || `Hello ${userName}! I'm your interviewer from ${company}. Let's begin the ${sessionType} interview for the ${role} position. Are you ready?`
      setTranscript([{ role: 'AI Coach', text: introMessage }])
      speechSynthesis.getVoices()
      await new Promise(r => setTimeout(r, 500))
      await speak(introMessage)
      if (mobile) setSessionStatus('listening')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start')
      setSessionStatus('ended')
    }
  }, [company, role, sessionType, userName, speak, sendToCoach, startListening])

  // End call
  const handleEndCall = useCallback(() => {
    shouldRestartRef.current = false
    isListeningRef.current = false
    sessionIdRef.current = null
    try { recognitionRef.current?.abort() } catch {}
    synthRef.current?.cancel()
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (abortControllerRef.current) { abortControllerRef.current.abort() }
    setSessionStatus('ended')
    setAiSpeaking(false)
  }, [])

  // Generate report
  const handleGetReport = useCallback(async () => {
    if (transcript.length < 4) {
      toast.error('Answer at least 2 questions to get a report')
      return
    }
    setGeneratingReport(true)
    try {
      const res = await authFetch('/api/coach/report', {
        method: 'POST',
        body: JSON.stringify({ transcript, company, role, sessionType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setReportData(data.report)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate report')
    } finally {
      setGeneratingReport(false)
    }
  }, [transcript, company, role, sessionType])

  // Cleanup
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false
      try { recognitionRef.current?.abort() } catch {}
      synthRef.current?.cancel()
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
      if (abortControllerRef.current) { abortControllerRef.current.abort() }
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Auto-start on mount
  useEffect(() => { handleJoin() }, [])

  if (typeof document === 'undefined') return null

  // Report view
  if (reportData) {
    return createPortal(
      <InterviewReport
        report={reportData}
        company={company}
        role={role}
        sessionType={sessionType}
        onClose={onClose}
      />,
      document.body
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#202124] flex flex-col">

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{company} — {sessionType} Interview</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Clock className="w-4 h-4" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-300">
            <Users className="w-4 h-4" />
            <span>2</span>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 flex items-center justify-center p-4 gap-4">
        {/* AI Interviewer */}
        <div className="relative flex-1 max-w-[600px] aspect-video bg-[#3c4043] rounded-xl overflow-hidden flex items-center justify-center">
          {/* AI Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className={`w-24 h-24 rounded-full bg-[#0A6A47] flex items-center justify-center text-white text-3xl font-bold ${aiSpeaking ? 'ring-4 ring-[#0A6A47]/50 animate-pulse' : ''}`}>
              P
            </div>
            <span className="text-white text-lg font-medium">PebelAI Interviewer</span>
            {sessionStatus === 'thinking' && (
              <span className="text-gray-400 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
              </span>
            )}
            {aiSpeaking && (
              <span className="text-green-400 text-sm flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> Speaking...
              </span>
            )}
          </div>
          {/* Name tag */}
          <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded text-white text-sm">
            PebelAI
          </div>
        </div>

        {/* User */}
        <div className="relative flex-1 max-w-[600px] aspect-video bg-[#3c4043] rounded-xl overflow-hidden flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className={`w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold ${sessionStatus === 'listening' && !isMuted ? 'ring-4 ring-blue-400/50' : ''}`}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-white text-lg font-medium">{userName}</span>
            {currentSpeech && (
              <p className="text-gray-300 text-sm max-w-[80%] text-center line-clamp-2">
                {currentSpeech}
              </p>
            )}
            {sessionStatus === 'listening' && !currentSpeech && !isMobile && (
              <span className="text-blue-400 text-sm">Listening...</span>
            )}
            {isMobile && sessionStatus === 'listening' && !isPushToTalkHeld && (
              <span className="text-gray-400 text-sm">Hold mic to speak</span>
            )}
          </div>
          {/* Name tag */}
          <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded text-white text-sm flex items-center gap-2">
            {userName}
            {isMuted && <MicOff className="w-3 h-3 text-red-400" />}
          </div>
          {/* Muted indicator */}
          {isMuted && (
            <div className="absolute top-3 right-3 bg-red-500 p-1.5 rounded-full">
              <MicOff className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Joining overlay */}
      <AnimatePresence>
        {sessionStatus === 'joining' && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#202124] flex flex-col items-center justify-center z-10"
          >
            <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
            <p className="text-white text-xl font-medium">Joining interview...</p>
            <p className="text-gray-400 text-sm mt-2">{company} — {role}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ended overlay */}
      <AnimatePresence>
        {sessionStatus === 'ended' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#202124] flex flex-col items-center justify-center z-10 gap-4"
          >
            <Phone className="w-16 h-16 text-red-400" />
            <p className="text-white text-xl font-medium">Interview Ended</p>
            <p className="text-gray-400 text-sm">Duration: {formatTime(elapsedTime)}</p>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleGetReport}
                disabled={generatingReport || transcript.length < 4}
                className="flex items-center gap-2 px-6 py-3 bg-[#0A6A47] text-white rounded-full font-semibold hover:bg-[#085c3d] transition-colors disabled:opacity-50"
              >
                {generatingReport ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Generating Report...</>
                ) : (
                  <><FileText className="w-5 h-5" /> Get Performance Report</>
                )}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-[#3c4043] text-white rounded-full font-medium hover:bg-[#4c5053] transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      {sessionStatus !== 'joining' && sessionStatus !== 'ended' && (
        <div className="flex items-center justify-center gap-4 py-5 bg-[#202124]">
          {/* Mute */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-[#3c4043] hover:bg-[#4c5053]'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
          </button>

          {/* Push to talk (mobile) */}
          {isMobile && (
            <button
              onPointerDown={e => { e.preventDefault(); handlePushToTalkStart() }}
              onPointerUp={e => { e.preventDefault(); handlePushToTalkEnd() }}
              onPointerCancel={e => { e.preventDefault(); handlePushToTalkEnd() }}
              onPointerLeave={e => { e.preventDefault(); handlePushToTalkEnd() }}
              onContextMenu={e => e.preventDefault()}
              disabled={sessionStatus === 'thinking' || sessionStatus === 'speaking'}
              style={{ touchAction: 'none' }}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isPushToTalkHeld
                  ? 'bg-blue-500 scale-110'
                  : 'bg-[#0A6A47] hover:bg-[#085c3d]'
              } disabled:opacity-50`}
            >
              <Mic className={`w-7 h-7 text-white ${isPushToTalkHeld ? 'animate-pulse' : ''}`} />
            </button>
          )}

          {/* Chat */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              showChat ? 'bg-[#0A6A47]' : 'bg-[#3c4043] hover:bg-[#4c5053]'
            }`}
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </button>

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="w-14 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
          >
            <Phone className="w-5 h-5 text-white rotate-[135deg]" />
          </button>
        </div>
      )}

      {/* Chat Panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-white flex flex-col z-20 shadow-2xl"
          >
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Interview Transcript</h3>
              <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-gray-600">
                <MicOff className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcript.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'You' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'You'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <span className="block text-[10px] font-bold text-gray-500 mb-1">{msg.role}</span>
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
