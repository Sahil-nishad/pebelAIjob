'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type ElementType } from 'react'
import { motion } from 'framer-motion'
import {
  Send,
  Plus,
  Brain,
  Code,
  BarChart3,
  DollarSign,
  Target,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  SkipForward,
  HelpCircle,
  Clock,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authFetch } from '@/lib/api'
import toast from 'react-hot-toast'

type SessionType = 'behavioral' | 'technical' | 'case' | 'salary' | 'general'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface SessionRecord {
  id: string
  company: string
  role: string
  session_type: string
  created_at: string
}

const sessionTypes: { type: SessionType; icon: ElementType; label: string }[] = [
  { type: 'behavioral', icon: Brain, label: 'Behavioral' },
  { type: 'technical', icon: Code, label: 'Technical' },
  { type: 'case', icon: BarChart3, label: 'Case Study' },
  { type: 'salary', icon: DollarSign, label: 'Salary Negotiation' },
  { type: 'general', icon: Target, label: 'General Prep' },
]

function formatMessage(text: string) {
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const bolded = escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  const lines = bolded.split(/\r?\n/)
  const parts: string[] = []
  let inList = false

  const closeList = () => {
    if (inList) {
      parts.push('</ul>')
      inList = false
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      closeList()
      continue
    }

    const bulletMatch = line.match(/^[-•*]\s+(.*)$/)
    if (bulletMatch) {
      if (!inList) {
        parts.push('<ul class="ml-5 list-disc space-y-1">')
        inList = true
      }
      parts.push(`<li>${bulletMatch[1]}</li>`)
      continue
    }

    closeList()
    parts.push(`<p>${line}</p>`)
  }

  closeList()
  return parts.join('')
}

export default function CoachPage() {
  const [hasSession, setHasSession] = useState(false)
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [selectedType, setSelectedType] = useState<SessionType | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    authFetch('/api/coach/sessions')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setSessions(d)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (hasSession) {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setElapsedSeconds(0)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [hasSession])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const resetComposer = () => {
    setHasSession(false)
    setMessages([])
    setSessionId(null)
    setQuestionCount(0)
    setInput('')
    setCompany('')
    setRole('')
    setSelectedType(null)
    setElapsedSeconds(0)
  }

  const deleteSession = async (id: string) => {
    if (!confirm('Delete this coaching session?')) return
    try {
      const res = await authFetch(`/api/coach/sessions/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to delete session')

      setSessions((prev) => prev.filter((session) => session.id !== id))
      if (sessionId === id) resetComposer()
      toast.success('Session deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete session')
    }
  }

  const startSession = async () => {
    if (!company || !selectedType) return
    setIsTyping(true)
    try {
      const res = await authFetch('/api/coach/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, role, sessionType: selectedType }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to start session')
      setSessionId(data.session.id)
      setHasSession(true)
      setMessages([{ role: 'assistant', content: data.introMessage }])
      setSessions((prev) => [data.session, ...prev])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start session'
      toast.error(msg)
    } finally {
      setIsTyping(false)
    }
  }

  const sendMessage = async (messageOverride?: string) => {
    const text = messageOverride ?? input
    if (!text.trim() || !sessionId) return
    const userMessage: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)
    try {
      const res = await authFetch('/api/coach/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
      setQuestionCount((q) => q + 1)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get AI response'
      toast.error(msg)
    } finally {
      setIsTyping(false)
    }
  }

  const loadSession = async (session: SessionRecord) => {
    try {
      const res = await authFetch(`/api/coach/sessions/${session.id}`)
      if (!res.ok) return
      const data = await res.json()
      setCompany(session.company)
      setRole(session.role)
      setSelectedType(session.session_type as SessionType)
      setSessionId(session.id)
      const displayMessages = (data.messages || [])
        .filter((m: { role: string }) => m.role !== 'system')
        .map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      setMessages(displayMessages)
      setHasSession(true)
    } catch {
      toast.error('Failed to load session')
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-3 animate-fade-up">
      <div className="flex items-center justify-end">
        <Button onClick={resetComposer} className="shadow-sm">
          <Plus className="w-4 h-4" /> New Session
        </Button>
      </div>

      <div className="grid min-h-[calc(100vh-11rem)] items-start gap-6 xl:grid-cols-[18rem_minmax(0,1fr)] 2xl:grid-cols-[18rem_minmax(0,1fr)_18rem]">
        <aside className="sticky top-20 hidden max-h-[calc(100vh-14rem)] flex-col gap-4 overflow-hidden rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm xl:flex">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Sessions</h3>
            <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{sessions.length}</span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {sessions.length === 0 && <p className="py-4 text-center text-xs text-slate-400">No sessions yet</p>}
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group rounded-xl border p-3 transition-colors hover:bg-slate-50 ${
                  sessionId === session.id ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => loadSession(session)} className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium text-slate-900">{session.company}</p>
                    <p className="truncate text-xs text-slate-500">{session.role}</p>
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    title="Delete session"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Badge variant="default" className="capitalize">
                    {session.session_type}
                  </Badge>
                  <span className="text-[10px] text-slate-400">
                    {new Date(session.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex flex-col">
          {!hasSession ? (
            <section className="flex-1 px-2 pb-4 pt-0 sm:px-6">
              <div className="w-full max-w-4xl rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                      <Image src="/pebelai-mark.svg" alt="PebelAI" width={22} height={22} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-slate-900">
                        AI Interview Coach
                      </h2>
                      <p className="text-sm text-slate-500">
                        Practice with AI tailored to your role and company
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 px-6 py-6 sm:px-8">
                  <Input
                    id="company"
                    label="Which company?"
                    placeholder="Google, Meta, Stripe..."
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                  <Input
                    id="role"
                    label="What's the role?"
                    placeholder="Senior Product Manager"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Interview type</label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {sessionTypes.map((st) => (
                        <button
                          key={st.type}
                          type="button"
                          onClick={() => setSelectedType(st.type)}
                          className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all cursor-pointer ${
                            selectedType === st.type
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <st.icon className="h-4 w-4" />
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button size="lg" className="w-full" onClick={startSession} disabled={!company || !selectedType || isTyping}>
                    {isTyping ? 'Starting session...' : 'Start Coaching Session'}
                    {!isTyping && <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </section>
          ) : (
            <section className="flex min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
                    {company.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{company}</p>
                    <p className="truncate text-xs text-slate-500">{role}</p>
                  </div>
                  <Badge variant="default" className="capitalize">
                    {selectedType}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => deleteSession(sessionId || '')} disabled={!sessionId}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetComposer}>
                    End Session
                  </Button>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#ffffff,rgba(248,250,252,0.7))] p-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="mr-2 mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
                        <Image src="/pebelai-mark.svg" alt="PebelAI" width={18} height={18} />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-emerald-500 text-white'
                          : 'border border-slate-100 bg-white text-slate-800 shadow-sm'
                      }`}
                    >
                      <div
                        className="whitespace-normal text-sm leading-relaxed [&_p]:m-0 [&_p+p]:mt-2 [&_ul]:m-0 [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:marker:text-slate-400"
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                      />
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2 px-4 py-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
                      <Image src="/pebelai-mark.svg" alt="PebelAI" width={18} height={18} />
                    </div>
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-slate-100 bg-white p-4">
                <div className="mb-2 flex gap-2">
                  <button
                    onClick={() => sendMessage("I'm not sure how to answer this. Can you give me a hint or example?")}
                    disabled={isTyping}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
                  >
                    <HelpCircle className="h-3.5 w-3.5" /> I&apos;m not sure
                  </button>
                  <button
                    onClick={() => sendMessage('Please skip this question and move to the next one.')}
                    disabled={isTyping}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
                  >
                    <SkipForward className="h-3.5 w-3.5" /> Skip
                  </button>
                </div>

                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder="Type your answer... (Shift+Enter for new line)"
                    rows={3}
                    disabled={isTyping}
                    className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                  />
                  <Button onClick={() => sendMessage()} disabled={!input.trim() || isTyping}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </section>
          )}
        </main>

        {hasSession && (
          <aside className="sticky top-20 hidden max-h-[calc(100vh-14rem)] flex-col gap-4 overflow-y-auto 2xl:flex">
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Session Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Questions</span>
                  <span className="font-medium text-slate-900">{questionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time</span>
                  <span className="flex items-center gap-1 font-medium text-slate-900">
                    <Clock className="h-3 w-3" /> {formatTime(elapsedSeconds)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium capitalize text-slate-900">{selectedType}</span>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">STAR Method</h3>
              <div className="space-y-2 text-xs text-slate-600">
                <p>
                  <strong className="text-slate-900">S</strong>ituation - Set the scene
                </p>
                <p>
                  <strong className="text-slate-900">T</strong>ask - Your responsibility
                </p>
                <p>
                  <strong className="text-slate-900">A</strong>ction - What you did
                </p>
                <p>
                  <strong className="text-slate-900">R</strong>esult - The outcome with numbers
                </p>
              </div>
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Tips</h3>
              <div className="space-y-2">
                {[
                  { icon: CheckCircle2, color: 'text-emerald-500', tip: 'Be specific with examples' },
                  { icon: Lightbulb, color: 'text-amber-500', tip: 'Quantify impact with numbers' },
                  { icon: AlertTriangle, color: 'text-blue-500', tip: 'Keep answers under 2 minutes' },
                ].map(({ icon: Icon, color, tip }) => (
                  <div key={tip} className="flex items-start gap-2 text-xs text-slate-600">
                    <Icon className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${color}`} />
                    {tip}
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        )}
      </div>
    </div>
  )
}
