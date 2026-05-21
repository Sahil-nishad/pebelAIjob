'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Search, FileText, Loader2, ExternalLink,
  Bookmark, CheckCircle, Sparkles, MapPin, Briefcase,
  Globe, X, Zap, RotateCcw, ArrowLeft, ArrowRight,
  Copy, ClipboardCheck,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Job {
  id: string
  source: string
  title: string
  company: string
  location: string
  salary: string
  experience_required: string
  skills: string[]
  description: string
  apply_url: string
  posted_date: string
  job_type: string
  remote: boolean
  match_score: number | null
  matching_skills: string[]
  missing_skills: string[]
  why_good_fit: string
}

interface ResumeData {
  id: string
  file_name: string
  extracted_skills: string[]
  parsed_name: string | null
}

function getSourceBadge(source: string) {
  const map: Record<string, { bg: string; label: string }> = {
    indeed: { bg: 'bg-blue-600', label: 'Indeed' },
    linkedin: { bg: 'bg-blue-800', label: 'LinkedIn' },
    remoteok: { bg: 'bg-green-600', label: 'RemoteOK' },
    google: { bg: 'bg-red-500', label: 'Google' },
    adzuna: { bg: 'bg-purple-600', label: 'Adzuna' },
    jsearch: { bg: 'bg-orange-600', label: 'JSearch' },
  }
  return map[source] || { bg: 'bg-gray-500', label: source }
}

function getScoreColor(score: number) {
  if (score >= 80) return { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' }
  if (score >= 60) return { bar: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' }
  if (score >= 40) return { bar: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' }
  return { bar: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
}

function isQuickApply(url: string) {
  return url && (url.includes('greenhouse.io') || url.includes('lever.co') || url.includes('ashbyhq.com'))
}

// ── Assisted Apply Modal ─────────────────────────────────────
function AssistedApplyModal({
  job,
  userInfo,
  checklist,
  onClose,
}: {
  job: Job
  userInfo: { name: string; email: string; skills: string; experience: string }
  checklist: { step: number; label: string; value: string }[]
  onClose: () => void
}) {
  const [copied, setCopied] = useState<Record<string, boolean>>({})
  const [done, setDone] = useState<Record<number, boolean>>({})

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(prev => ({ ...prev, [key]: true }))
      setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A6A47] to-emerald-500 p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-200 uppercase tracking-wide mb-1">Assisted Apply</p>
              <h3 className="font-bold text-lg leading-tight">{job.title}</h3>
              <p className="text-emerald-100 text-sm">{job.company}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Your Info */}
        <div className="p-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Info — Click to Copy</p>
          <div className="space-y-2">
            {[
              { label: 'Full Name', value: userInfo.name, key: 'name' },
              { label: 'Email', value: userInfo.email, key: 'email' },
              { label: 'Top Skills', value: userInfo.skills, key: 'skills' },
            ].filter(item => item.value).map(item => (
              <button key={item.key} onClick={() => copyToClipboard(item.value, item.key)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left group">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">{item.label}</p>
                  <p className="text-sm text-gray-800 truncate">{item.value}</p>
                </div>
                <div className={`flex-shrink-0 ml-2 p-1.5 rounded-lg transition-colors ${copied[item.key] ? 'bg-green-100 text-green-600' : 'bg-white text-gray-400 group-hover:text-gray-600'}`}>
                  {copied[item.key] ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div className="p-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Application Checklist</p>
          <div className="space-y-2">
            {checklist.map(item => (
              <button key={item.step} onClick={() => setDone(prev => ({ ...prev, [item.step]: !prev[item.step] }))}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  done[item.step] ? 'bg-[#0A6A47] border-[#0A6A47]' : 'border-gray-300'
                }`}>
                  {done[item.step] && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className={`text-sm ${done[item.step] ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Open Job Button */}
        <div className="p-5">
          <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#0A6A47] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#085c3d] transition-colors">
            <ExternalLink className="w-4 h-4" /> Open Job Application Page
          </a>
          <p className="text-center text-xs text-gray-400 mt-2">Your info is ready to paste</p>
        </div>
      </motion.div>
    </div>
  )
}

export default function CareersPage() {
  const [resume, setResume] = useState<ResumeData | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loadingResume, setLoadingResume] = useState(true)
  const [searching, setSearching] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [location, setLocation] = useState('')
  const [totalFound, setTotalFound] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [history, setHistory] = useState<number[]>([])
  const [applying, setApplying] = useState(false)
  const [assistedApply, setAssistedApply] = useState<{
    job: Job; userInfo: any; checklist: any[]
  } | null>(null)

  useEffect(() => { fetchResume() }, [])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!hasSearched || currentIndex >= jobs.length) return
      if (e.key === 'ArrowLeft') handleSkip()
      if (e.key === 'ArrowRight') handleApply()
      if (e.key === 'ArrowDown' || e.key === 'z') handleUndo()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [hasSearched, currentIndex, jobs.length])

  const fetchResume = async () => {
    try {
      const res = await fetch('/api/careers/resumes?active_only=true')
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) setResume(data[0])
      }
    } catch {}
    finally { setLoadingResume(false) }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/careers/resumes/upload', { method: 'POST', body: formData })
      if (res.ok) { setResume(await res.json()); toast.success('Resume uploaded & parsed!') }
      else toast.error('Failed to upload')
    } catch { toast.error('Failed to upload') }
    finally { setUploading(false) }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type)) { toast.error('Only PDF and DOCX allowed'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return }
    handleUpload(file)
  }

  const handleSearch = async () => {
    if (!resume) { toast.error('Upload your resume first'); return }
    setSearching(true); setHasSearched(true); setCurrentIndex(0); setHistory([])
    try {
      const body: any = { resume_id: resume.id, top_n: 10 }
      if (location.trim()) body.location = location.trim()
      const res = await fetch('/api/careers/jobs/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        let results = data.jobs || []
        if (remoteOnly) results = results.filter((j: Job) => j.remote)
        setJobs(results); setTotalFound(data.total_found || 0)
        toast.success(results.length > 0 ? `Found ${results.length} jobs!` : 'No jobs found')
      } else toast.error('Search failed')
    } catch { toast.error('Failed to search') }
    finally { setSearching(false) }
  }

  const handleSaveJob = async (job: Job) => {
    try {
      await fetch('/api/careers/jobs/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(job),
      })
    } catch {}
  }

  const handleSmartApply = async (job: Job) => {
    if (!resume) { toast.error('Upload your resume first'); return }
    setApplying(true)
    try {
      const res = await fetch('/api/careers/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_url: job.apply_url,
          job_title: job.title,
          company: job.company,
          resume_id: resume.id,
        }),
      })
      const data = await res.json()

      if (data.method === 'greenhouse_api' || data.method === 'lever_api') {
        toast.success(data.message || 'Applied successfully!')
        handleSaveJob(job)
      } else {
        // Assisted apply — show modal
        setAssistedApply({ job, userInfo: data.user_info, checklist: data.checklist })
        handleSaveJob(job)
      }
    } catch {
      window.open(job.apply_url, '_blank')
    } finally {
      setApplying(false)
      // Always advance to next card after apply
      setDirection('right')
      setHistory(prev => [...prev, currentIndex])
      setTimeout(() => { setCurrentIndex(prev => prev + 1); setDirection(null) }, 300)
    }
  }

  const handleSkip = useCallback(() => {
    if (currentIndex >= jobs.length) return
    setDirection('left')
    setHistory(prev => [...prev, currentIndex])
    setTimeout(() => { setCurrentIndex(prev => prev + 1); setDirection(null) }, 300)
  }, [currentIndex, jobs.length])

  const handleApply = useCallback(() => {
    if (currentIndex >= jobs.length) return
    const job = jobs[currentIndex]
    handleSmartApply(job)
  }, [currentIndex, jobs])

  const handleUndo = useCallback(() => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    setCurrentIndex(prev)
  }, [history])

  const skills = (() => {
    if (!resume?.extracted_skills) return []
    const s = resume.extracted_skills
    if (typeof s === 'string') { try { return JSON.parse(s) } catch { return [] } }
    return Array.isArray(s) ? s : []
  })()

  const currentJob = jobs[currentIndex]
  const isDone = hasSearched && jobs.length > 0 && currentIndex >= jobs.length

  if (loadingResume) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 text-[#0A6A47] animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

      {/* Assisted Apply Modal */}
      <AnimatePresence>
        {assistedApply && (
          <AssistedApplyModal
            job={assistedApply.job}
            userInfo={assistedApply.userInfo}
            checklist={assistedApply.checklist}
            onClose={() => setAssistedApply(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Job Search</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {hasSearched && jobs.length > 0
            ? `${currentIndex} of ${jobs.length} reviewed · Use ← → arrow keys`
            : 'Upload resume → Find perfectly matched jobs'}
        </p>
      </div>

      {/* Resume + Search Row */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        {!resume ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0A6A47]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-[#0A6A47]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">Upload your resume to get started</p>
              <p className="text-xs text-gray-500">PDF or DOCX · Max 10MB</p>
            </div>
            <label className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold cursor-pointer text-sm transition-all ${
              uploading ? 'bg-gray-100 text-gray-400' : 'bg-[#0A6A47] text-white hover:bg-[#085c3d]'
            }`}>
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Parsing...</> : <><Upload className="w-4 h-4" /> Upload</>}
              <input type="file" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" disabled={uploading} />
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Resume info */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{resume.file_name}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Parsed · {skills.length} skills found
                </p>
              </div>
              <button onClick={() => { setResume(null); setJobs([]); setHasSearched(false) }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search controls */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="City (e.g., Bangalore, Noida)"
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent outline-none" />
              </div>
              <button onClick={() => setRemoteOnly(!remoteOnly)}
                title="Remote only"
                className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all flex-shrink-0 ${
                  remoteOnly ? 'bg-[#0A6A47] text-white border-[#0A6A47]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}>
                <Globe className="w-4 h-4" />
              </button>
              <button onClick={handleSearch} disabled={searching}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0A6A47] text-white rounded-xl font-semibold text-sm hover:bg-[#085c3d] transition-colors disabled:opacity-50 flex-shrink-0">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {searching ? 'Searching...' : 'Find Jobs'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Job Card Area */}
      {hasSearched && (
        <>
          {/* Progress bar */}
          {jobs.length > 0 && !isDone && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-16 text-right">{currentIndex}/{jobs.length}</span>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#0A6A47] rounded-full transition-all duration-500"
                  style={{ width: `${(currentIndex / jobs.length) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-500 w-16">{jobs.length - currentIndex} left</span>
            </div>
          )}

          {/* Card */}
          <div className="relative" style={{ minHeight: 480 }}>
            <AnimatePresence mode="wait">
              {isDone ? (
                <motion.div key="done"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
                  <div className="w-14 h-14 bg-[#0A6A47]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-[#0A6A47]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">All done!</h3>
                  <p className="text-gray-500 text-sm mb-5">You reviewed all {jobs.length} jobs</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={handleSearch}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#0A6A47] text-white rounded-xl font-semibold text-sm hover:bg-[#085c3d] transition-colors">
                      <Search className="w-4 h-4" /> Find More
                    </button>
                    {history.length > 0 && (
                      <button onClick={handleUndo}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">
                        <RotateCcw className="w-4 h-4" /> Go Back
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : currentJob ? (
                <motion.div key={currentJob.id}
                  initial={{ opacity: 0, x: direction === 'left' ? -60 : direction === 'right' ? 60 : 0, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: direction === 'left' ? -80 : 80, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start gap-4">
                      {/* Company initial */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 flex-shrink-0">
                        {currentJob.company?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h2 className="font-bold text-gray-900 text-base leading-tight">{currentJob.title}</h2>
                            <p className="text-gray-600 text-sm mt-0.5">{currentJob.company}</p>
                          </div>
                          {currentJob.match_score !== null && (() => {
                            const c = getScoreColor(currentJob.match_score)
                            return (
                              <div className={`flex-shrink-0 px-2.5 py-1 rounded-xl border text-sm font-bold ${c.bg} ${c.text} ${c.border}`}>
                                {currentJob.match_score}%
                              </div>
                            )
                          })()}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />{currentJob.location || 'India'}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Briefcase className="w-3 h-3" />{currentJob.salary || 'Not disclosed'}
                          </span>
                          {currentJob.remote && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Remote</span>
                          )}
                          <span className={`text-[10px] text-white px-2 py-0.5 rounded-full font-bold ${getSourceBadge(currentJob.source).bg}`}>
                            {getSourceBadge(currentJob.source).label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4">
                    {/* AI Insight */}
                    {currentJob.why_good_fit && (
                      <div className="bg-[#0A6A47]/5 border border-[#0A6A47]/10 rounded-xl p-3">
                        <p className="text-xs font-semibold text-[#0A6A47] flex items-center gap-1 mb-1">
                          <Sparkles className="w-3 h-3" /> AI Match Insight
                        </p>
                        <p className="text-sm text-gray-700">&ldquo;{currentJob.why_good_fit}&rdquo;</p>
                      </div>
                    )}

                    {/* Skills */}
                    {(currentJob.matching_skills?.length > 0 || currentJob.missing_skills?.length > 0) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Skills Match</p>
                        <div className="flex flex-wrap gap-1.5">
                          {currentJob.matching_skills?.slice(0, 6).map((s) => (
                            <span key={s} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200 font-medium">✓ {s}</span>
                          ))}
                          {currentJob.missing_skills?.slice(0, 3).map((s) => (
                            <span key={s} className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full border border-orange-200 font-medium">✗ {s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {currentJob.description && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">About the Role</p>
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{currentJob.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer — Actions */}
                  <div className="px-5 pb-5 flex items-center gap-2">
                    {isQuickApply(currentJob.apply_url) ? (
                      <button onClick={() => handleSmartApply(currentJob)} disabled={applying}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0A6A47] to-emerald-500 text-white py-2.5 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-50">
                        {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {applying ? 'Applying...' : 'Quick Apply'}
                      </button>
                    ) : (
                      <button onClick={() => handleSmartApply(currentJob)} disabled={applying}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#0A6A47] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#085c3d] transition-colors disabled:opacity-50">
                        {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {applying ? 'Preparing...' : 'Smart Apply'}
                      </button>
                    )}
                    <button onClick={() => { handleSaveJob(currentJob); toast.success('Saved!') }}
                      className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          {!isDone && currentJob && (
            <div className="flex items-center justify-between">
              {/* Previous */}
              <button onClick={handleUndo} disabled={history.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed">
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>

              {/* Apply → Next */}
              <button onClick={handleApply} disabled={applying}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0A6A47] text-white rounded-xl font-semibold text-sm hover:bg-[#085c3d] transition-all shadow-sm disabled:opacity-50">
                {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {applying ? 'Applying...' : 'Apply'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!hasSearched && resume && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Sparkles className="w-9 h-9 text-[#0A6A47] mx-auto mb-3" />
          <p className="text-gray-900 font-semibold">Ready to find jobs</p>
          <p className="text-gray-500 text-sm mt-1">Click &ldquo;Find Jobs&rdquo; to get AI-matched results</p>
        </div>
      )}
    </div>
  )
}
