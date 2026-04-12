'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type ElementType } from 'react'
import { motion } from 'framer-motion'
import {
  Send, Plus, Brain, Code, BarChart3, DollarSign, Target,
  SkipForward, HelpCircle, Clock, Trash2, Sparkles, ArrowRight,
} from 'lucide-react'
import { authFetch } from '@/lib/api'
import toast from 'react-hot-toast'

type SessionType = 'behavioral' | 'technical' | 'case' | 'salary' | 'general'
interface Message { role: 'user' | 'assistant'; content: string }
interface SessionRecord { id: string; company: string; role: string; session_type: string; created_at: string }

const sessionTypes: { type: SessionType; icon: ElementType; label: string; desc: string }[] = [
  { type: 'behavioral', icon: Brain,      label: 'Behavioral',         desc: 'Soft skills, leadership & STAR method' },
  { type: 'technical',  icon: Code,       label: 'Technical',          desc: 'Logic, systems & craft challenges' },
  { type: 'case',       icon: BarChart3,  label: 'Case Study',         desc: 'Structured problem solving' },
  { type: 'salary',     icon: DollarSign, label: 'Salary Negotiation', desc: 'Advocate for your worth' },
  { type: 'general',    icon: Target,     label: 'General Prep',       desc: 'Comprehensive interview prep' },
]

const typeColor: Record<SessionType, string> = {
  behavioral: 'text-violet-700 bg-violet-50',
  technical:  'text-blue-700 bg-blue-50',
  case:       'text-amber-700 bg-amber-50',
  salary:     'text-emerald-700 bg-emerald-50',
  general:    'text-slate-600 bg-slate-100',
}

function formatMessage(text: string) {
  const esc = (v: string) => v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
  const bolded = esc(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  const lines = bolded.split(/\r?\n/)
  const parts: string[] = []
  let inList = false
  const closeList = () => { if (inList) { parts.push('</ul>'); inList = false } }
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) { closeList(); continue }
    const m = line.match(/^[-•*]\s+(.*)$/)
    if (m) { if (!inList) { parts.push('<ul class="ml-5 list-disc space-y-1">'); inList = true } parts.push(`<li>${m[1]}</li>`); continue }
    closeList(); parts.push(`<p>${line}</p>`)
  }
  closeList(); return parts.join('')
}

export default function CoachPage() {
  const [hasSession, setHasSession]     = useState(false)
  const [company, setCompany]           = useState('')
  const [role, setRole]                 = useState('')
  const [selectedType, setSelectedType] = useState<SessionType | null>(null)
  const [messages, setMessages]         = useState<Message[]>([])
  const [input, setInput]               = useState('')
  const [isTyping, setIsTyping]         = useState(false)
  const [sessionId, setSessionId]       = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [sessions, setSessions]         = useState<SessionRecord[]>([])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    authFetch('/api/coach/sessions').then(r => r.json()).then(d => { if (Array.isArray(d)) setSessions(d) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (hasSession) { timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000) }
    else { if (timerRef.current) clearInterval(timerRef.current); setElapsedSeconds(0) }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [hasSession])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const resetComposer = () => {
    setHasSession(false); setMessages([]); setSessionId(null)
    setQuestionCount(0); setInput(''); setCompany(''); setRole(''); setSelectedType(null); setElapsedSeconds(0)
  }

  const deleteSession = async (id: string) => {
    if (!confirm('Delete this coaching session?')) return
    try {
      const res = await authFetch(`/api/coach/sessions/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setSessions(prev => prev.filter(s => s.id !== id))
      if (sessionId === id) resetComposer()
      toast.success('Session deleted')
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  const startSession = async () => {
    if (!company || !selectedType) return
    setIsTyping(true)
    try {
      const res = await authFetch('/api/coach/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company, role, sessionType: selectedType }) })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to start session')
      setSessionId(data.session.id); setHasSession(true)
      setMessages([{ role: 'assistant', content: data.introMessage }])
      setSessions(prev => [data.session, ...prev])
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to start session') }
    finally { setIsTyping(false) }
  }

  const sendMessage = async (override?: string) => {
    const text = override ?? input
    if (!text.trim() || !sessionId) return
    setMessages(prev => [...prev, { role: 'user', content: text }]); setInput(''); setIsTyping(true)
    try {
      const res = await authFetch('/api/coach/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, message: text }) })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      setQuestionCount(q => q + 1)
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to get AI response') }
    finally { setIsTyping(false) }
  }

  const loadSession = async (session: SessionRecord) => {
    try {
      const res = await authFetch(`/api/coach/sessions/${session.id}`)
      if (!res.ok) return
      const data = await res.json()
      setCompany(session.company); setRole(session.role); setSelectedType(session.session_type as SessionType); setSessionId(session.id)
      const msgs = (data.messages || []).filter((m: { role: string }) => m.role !== 'system').map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      setMessages(msgs); setHasSession(true)
    } catch { toast.error('Failed to load session') }
  }

  return (
    <div className="flex -m-4 md:-mx-6 md:-mb-8 lg:-mx-8 lg:-mb-8 min-h-[calc(100vh-4rem)] animate-fade-up">

      {/* ── Session History Sidebar ── */}
      <aside className="hidden xl:flex w-72 flex-shrink-0 flex-col bg-[#f3f4f5] overflow-hidden">
        <div className="flex items-center justify-between px-7 pt-8 pb-5">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-stone-400">History</h2>
          <span className="text-[10px] bg-stone-200 px-2 py-0.5 rounded-full font-bold text-stone-500">{sessions.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-2.5">
          {sessions.length === 0 && <p className="text-center text-xs text-stone-400 py-10">No sessions yet</p>}
          {sessions.map(session => (
            <div
              key={session.id}
              className={`group p-4 bg-white rounded-2xl hover:shadow-md transition-all duration-200 cursor-pointer border-2 ${sessionId === session.id ? 'border-emerald-600' : 'border-transparent hover:border-emerald-100'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${typeColor[session.session_type as SessionType] || 'text-slate-600 bg-slate-100'}`}>
                  {session.session_type}
                </span>
                <button onClick={e => { e.stopPropagation(); deleteSession(session.id) }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 text-stone-300 transition-all">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <button onClick={() => loadSession(session)} className="w-full text-left">
                <p className="font-bold text-sm text-stone-800 group-hover:text-emerald-900 transition-colors">{session.company}</p>
                <p className="text-xs text-stone-500 truncate mt-0.5">{session.role}</p>
                <p className="text-[10px] text-stone-400 mt-2.5">{new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main Area ── */}
      <main className="flex-1 flex flex-col bg-[#f8f9fa] overflow-hidden min-w-0">
        {!hasSession ? (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10 sm:py-14">

              {/* Hero */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 mb-5 bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-100">
                  <Sparkles className="w-3 h-3" /> Curated AI Coaching
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-heading)] tracking-tight text-slate-900 mb-3 leading-[1.1]">
                  Sharpen Your Story.
                </h2>
                <p className="text-slate-400 text-base max-w-lg mx-auto leading-relaxed">
                  The Curator analyzes your target role and simulates a high-fidelity interview experience tailored to you.
                </p>
              </div>

              {/* Form Card */}
              <div className="bg-white p-7 sm:p-9 rounded-[2rem] shadow-sm ring-1 ring-black/5">

                {/* Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-9">
                  {[
                    { label: 'Company', value: company, setter: setCompany, placeholder: 'e.g. Stripe' },
                    { label: 'Role Title', value: role, setter: setRole, placeholder: 'e.g. Senior Designer' },
                  ].map(({ label, value, setter, placeholder }) => (
                    <div key={label}>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">{label}</label>
                      <input
                        value={value}
                        onChange={e => setter(e.target.value)}
                        placeholder={placeholder}
                        className="w-full border-b-2 border-stone-100 focus:border-emerald-700 bg-transparent pb-3 text-xl font-bold text-slate-900 placeholder:text-stone-200 transition-colors focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Session Type */}
                <div className="mb-9">
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-5">Select Focus Area</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {sessionTypes.map(st => (
                      <button
                        key={st.type}
                        type="button"
                        onClick={() => setSelectedType(st.type)}
                        className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer ${
                          selectedType === st.type
                            ? 'border-emerald-700 bg-white shadow-md'
                            : 'border-transparent bg-[#f3f4f5] hover:bg-stone-200/70'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3.5 ${typeColor[st.type]}`}>
                          <st.icon className="w-[18px] h-[18px]" />
                        </div>
                        <div className="font-bold text-sm text-stone-800">{st.label}</div>
                        <div className="text-[10px] text-stone-400 mt-1 leading-tight">{st.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Curator Insight */}
                <div className="flex items-start gap-3.5 p-5 bg-emerald-50/80 rounded-2xl border border-emerald-100 mb-8">
                  <Sparkles className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-900 text-sm mb-1">Curator Insight</div>
                    <p className="text-xs text-emerald-800/70 leading-relaxed">
                      {company && selectedType
                        ? `We'll tailor your ${sessionTypes.find(s => s.type === selectedType)?.label ?? selectedType} session for ${role ? `a ${role} role ` : ''}at ${company} — questions will reflect company culture and hiring patterns.`
                        : 'Enter a company and select a focus area to receive AI-curated insights for your target position.'}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={startSession}
                  disabled={!company || !selectedType || isTyping}
                  className={`w-full py-5 rounded-xl font-bold tracking-widest text-sm uppercase flex items-center justify-center gap-3 transition-all duration-200 ${
                    company && selectedType && !isTyping
                      ? 'bg-gradient-to-r from-[#005344] to-[#006d5b] text-white shadow-lg hover:shadow-emerald-900/20 hover:scale-[0.995] active:scale-[0.99] cursor-pointer'
                      : 'bg-stone-100 text-stone-300 cursor-not-allowed'
                  }`}
                >
                  {isTyping ? 'Initializing...' : 'Initialize Session'}
                  {!isTyping && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-6 opacity-35">
                {[{ value: '1.2k+', label: 'Question Bank' }, { value: '450', label: 'Company Profiles' }, { value: 'Instant', label: 'AI Feedback' }].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-xl font-black text-stone-800">{s.value}</div>
                    <div className="text-[10px] font-bold uppercase text-stone-400 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── Chat ── */
          <div className="flex flex-1 flex-col min-h-0">
            {/* Chat header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 bg-white border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-sm font-black text-emerald-800 flex-shrink-0">{company.charAt(0)}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-stone-900 truncate">{company}</p>
                  <p className="text-xs text-stone-400 truncate">{role}</p>
                </div>
                {selectedType && (
                  <span className={`hidden sm:inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${typeColor[selectedType]}`}>{selectedType}</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-stone-400 bg-stone-50 px-3 py-1.5 rounded-full">
                  <Clock className="w-3 h-3" />{formatTime(elapsedSeconds)}
                </span>
                <button onClick={() => deleteSession(sessionId || '')} disabled={!sessionId} className="p-2 rounded-xl hover:bg-red-50 hover:text-red-500 text-stone-300 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={resetComposer} className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold transition-colors">End</button>
                <button onClick={resetComposer} className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#005344] to-[#006d5b] text-white text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity">
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#f8f9fa]">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="mr-2.5 mt-1 w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
                      <Image src="/pebelai-mark.svg" alt="PebelAI" width={18} height={18} />
                    </div>
                  )}
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-br from-[#005344] to-[#006d5b] text-white' : 'bg-white border border-stone-100 text-stone-800 shadow-sm'}`}>
                    <div className="whitespace-normal [&_p]:m-0 [&_p+p]:mt-2 [&_ul]:m-0 [&_ul]:pl-5 [&_ul]:space-y-1" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
                    <Image src="/pebelai-mark.svg" alt="PebelAI" width={18} height={18} />
                  </div>
                  <div className="bg-white border border-stone-100 rounded-2xl px-4 py-3 flex gap-1 shadow-sm">
                    {[0,150,300].map(d => <div key={d} className="h-2 w-2 animate-bounce rounded-full bg-stone-300" style={{ animationDelay:`${d}ms` }} />)}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="bg-white border-t border-stone-100 px-4 pt-3 pb-4 flex-shrink-0">
              <div className="flex gap-2 mb-2.5">
                {[
                  { icon: HelpCircle, label: "I'm not sure", msg: "I'm not sure how to answer this. Can you give me a hint?" },
                  { icon: ArrowRight, label: 'Skip',        msg: 'Please skip this question and move to the next one.' },
                ].map(({ icon: Icon, label, msg }) => (
                  <button key={label} onClick={() => sendMessage(msg)} disabled={isTyping} className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-[#f8f9fa] px-3 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100 disabled:opacity-40 transition-colors cursor-pointer">
                    <Icon className="h-3.5 w-3.5" />{label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2.5">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Type your answer... (Shift+Enter for new line)"
                  rows={3}
                  disabled={isTyping}
                  className="flex-1 resize-none rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/10 disabled:opacity-60 bg-[#f8f9fa]"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping}
                  className="self-end px-4 py-3 rounded-2xl bg-gradient-to-br from-[#005344] to-[#006d5b] text-white hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
