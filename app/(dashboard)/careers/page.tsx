'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import {
  Upload, Search, FileText, Loader2, ExternalLink,
  Bookmark, CheckCircle, AlertCircle, Sparkles,
  MapPin, Briefcase, Globe, X, Zap, ChevronLeft,
  ChevronRight, Heart, RotateCcw,
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
  raw_text: string | null
}

// Detect if job supports direct apply (Greenhouse/Lever)
function getApplyType(url: string): 'quick' | 'external' {
  if (!url) return 'external'
  if (url.includes('greenhouse.io') || url.includes('lever.co') || url.includes('ashbyhq.com')) {
    return 'quick'
  }
  return 'external'
}

function getSourceBadge(source: string) {
  const badges: Record<string, { bg: string; label: string }> = {
    indeed: { bg: 'bg-blue-600', label: 'Indeed' },
    linkedin: { bg: 'bg-blue-800', label: 'LinkedIn' },
    remoteok: { bg: 'bg-green-600', label: 'RemoteOK' },
    google: { bg: 'bg-red-500', label: 'Google' },
    adzuna: { bg: 'bg-purple-600', label: 'Adzuna' },
    jsearch: { bg: 'bg-orange-600', label: 'JSearch' },
  }
  return badges[source] || { bg: 'bg-gray-600', label: source }
}

function getScoreGradient(score: number) {
  if (score >= 80) return 'from-green-400 to-emerald-600'
  if (score >= 60) return 'from-blue-400 to-blue-600'
  if (score >= 40) return 'from-yellow-400 to-orange-500'
  return 'from-gray-400 to-gray-600'
}

// ── Swipe Card ──────────────────────────────────────────────
function JobCard({
  job,
  onSwipeLeft,
  onSwipeRight,
  onSave,
  isTop,
  index,
}: {
  job: Job
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onSave: (job: Job) => void
  isTop: boolean
  index: number
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-18, 18])
  const likeOpacity = useTransform(x, [20, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-100, -20], [1, 0])
  const badge = getSourceBadge(job.source)
  const applyType = getApplyType(job.apply_url)

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 120) onSwipeRight()
    else if (info.offset.x < -120) onSwipeLeft()
  }

  return (
    <motion.div
      style={{
        x,
        rotate,
        position: 'absolute',
        width: '100%',
        zIndex: 10 - index,
        scale: isTop ? 1 : 1 - index * 0.04,
        y: index * 10,
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ scale: isTop ? 1 : 1 - index * 0.04, y: index * 10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="cursor-grab active:cursor-grabbing"
    >
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden select-none">

        {/* Like / Nope overlays */}
        <motion.div style={{ opacity: likeOpacity }}
          className="absolute top-6 left-6 z-20 bg-green-500 text-white px-4 py-2 rounded-xl font-black text-xl rotate-[-12deg] border-4 border-green-400">
          APPLY ✓
        </motion.div>
        <motion.div style={{ opacity: nopeOpacity }}
          className="absolute top-6 right-6 z-20 bg-red-500 text-white px-4 py-2 rounded-xl font-black text-xl rotate-[12deg] border-4 border-red-400">
          SKIP ✗
        </motion.div>

        {/* Header gradient */}
        <div className={`bg-gradient-to-br ${getScoreGradient(job.match_score ?? 50)} p-6 text-white`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold leading-tight truncate">{job.title}</h2>
              <p className="text-white/80 font-medium mt-0.5">{job.company}</p>
            </div>
            {job.match_score !== null && (
              <div className="flex-shrink-0 ml-3 w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex flex-col items-center justify-center">
                <span className="text-lg font-black">{job.match_score}%</span>
                <span className="text-[9px] font-bold uppercase opacity-80">match</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full">
              <MapPin className="w-3 h-3" />{job.location || 'India'}
            </span>
            <span className="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full">
              <Briefcase className="w-3 h-3" />{job.salary || 'Not disclosed'}
            </span>
            {job.remote && (
              <span className="bg-white/20 px-2.5 py-1 rounded-full">🌐 Remote</span>
            )}
            <span className={`${badge.bg} px-2.5 py-1 rounded-full text-[10px] font-bold uppercase`}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* AI insight */}
          {job.why_good_fit && (
            <div className="bg-[#0A6A47]/5 border border-[#0A6A47]/10 rounded-xl p-3">
              <p className="text-xs text-[#0A6A47] font-semibold flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3" /> AI Match Insight
              </p>
              <p className="text-sm text-gray-700 italic">&ldquo;{job.why_good_fit}&rdquo;</p>
            </div>
          )}

          {/* Skills */}
          {(job.matching_skills?.length > 0 || job.missing_skills?.length > 0) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {job.matching_skills?.slice(0, 5).map((s) => (
                  <span key={s} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200 font-medium">
                    ✓ {s}
                  </span>
                ))}
                {job.missing_skills?.slice(0, 3).map((s) => (
                  <span key={s} className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full border border-orange-200 font-medium">
                    ✗ {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {job.description && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">About the Role</p>
              <p className="text-sm text-gray-600 line-clamp-3">{job.description}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            {applyType === 'quick' ? (
              <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0A6A47] to-emerald-500 text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all">
                <Zap className="w-4 h-4" /> Quick Apply
              </a>
            ) : (
              <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-[#0A6A47] text-white py-3 rounded-2xl font-bold text-sm hover:bg-[#085c3d] transition-colors">
                <ExternalLink className="w-4 h-4" /> Apply Now
              </a>
            )}
            <button onClick={() => onSave(job)}
              className="w-12 h-12 flex items-center justify-center bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-colors">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Page ────────────────────────────────────────────────
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
  const [skipped, setSkipped] = useState<Job[]>([])

  useEffect(() => { fetchResume() }, [])

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
    setSearching(true); setHasSearched(true); setCurrentIndex(0); setSkipped([])
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
        if (results.length > 0) toast.success(`Found ${results.length} matching jobs!`)
        else toast.error('No jobs found. Try different filters.')
      } else toast.error('Search failed')
    } catch { toast.error('Failed to search') }
    finally { setSearching(false) }
  }

  const handleSaveJob = async (job: Job) => {
    try {
      const res = await fetch('/api/careers/jobs/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(job),
      })
      if (res.ok) toast.success('Job saved!')
      else toast.error('Failed to save')
    } catch { toast.error('Failed to save') }
  }

  const handleSwipeLeft = () => {
    if (currentIndex < jobs.length) {
      setSkipped(prev => [...prev, jobs[currentIndex]])
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handleSwipeRight = () => {
    if (currentIndex < jobs.length) {
      const job = jobs[currentIndex]
      window.open(job.apply_url, '_blank')
      handleSaveJob(job)
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handleUndo = () => {
    if (skipped.length > 0 && currentIndex > 0) {
      setSkipped(prev => prev.slice(0, -1))
      setCurrentIndex(prev => prev - 1)
    }
  }

  const skills = (() => {
    if (!resume?.extracted_skills) return []
    const s = resume.extracted_skills
    if (typeof s === 'string') { try { return JSON.parse(s) } catch { return [] } }
    return Array.isArray(s) ? s : []
  })()

  const remainingJobs = jobs.slice(currentIndex)
  const isDone = hasSearched && jobs.length > 0 && currentIndex >= jobs.length

  if (loadingResume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0A6A47] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="mb-5 text-center">
          <h1 className="text-2xl font-bold text-gray-900">AI Job Search</h1>
          <p className="text-gray-500 text-sm mt-1">Swipe right to apply · Swipe left to skip</p>
        </div>

        {/* Resume Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
          {!resume ? (
            <div className="text-center py-2">
              <label className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold cursor-pointer transition-all text-sm ${
                uploading ? 'bg-gray-200 text-gray-500' : 'bg-[#0A6A47] text-white hover:bg-[#085c3d]'
              }`}>
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Parsing...</> : <><Upload className="w-4 h-4" /> Upload Resume</>}
                <input type="file" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" disabled={uploading} />
              </label>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{resume.file_name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {skills.slice(0, 5).map((s: string, i: number) => (
                    <span key={i} className="text-[10px] bg-[#0A6A47]/10 text-[#0A6A47] px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {skills.length > 5 && <span className="text-[10px] text-gray-400">+{skills.length - 5}</span>}
                </div>
              </div>
              <button onClick={() => { setResume(null); setJobs([]); setHasSearched(false) }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Search Controls */}
        {resume && (
          <div className="flex gap-2 mb-5">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="City (e.g., Bangalore)"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent" />
            </div>
            <button onClick={() => setRemoteOnly(!remoteOnly)}
              className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${remoteOnly ? 'bg-[#0A6A47] text-white border-[#0A6A47]' : 'bg-white text-gray-700 border-gray-200'}`}>
              <Globe className="w-4 h-4" />
            </button>
            <button onClick={handleSearch} disabled={searching}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0A6A47] text-white rounded-xl font-semibold text-sm hover:bg-[#085c3d] transition-colors disabled:opacity-50">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {searching ? 'Finding...' : 'Find'}
            </button>
          </div>
        )}

        {/* Job Cards Stack */}
        {hasSearched && (
          <>
            {isDone ? (
              /* All done */
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-xl p-10 text-center">
                <div className="w-16 h-16 bg-[#0A6A47]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[#0A6A47]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-500 text-sm mb-6">You&apos;ve reviewed all {jobs.length} jobs</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={handleSearch}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0A6A47] text-white rounded-xl font-semibold text-sm hover:bg-[#085c3d] transition-colors">
                    <Search className="w-4 h-4" /> Find More
                  </button>
                  {skipped.length > 0 && (
                    <button onClick={handleUndo}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">
                      <RotateCcw className="w-4 h-4" /> Review Skipped
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <>
                {/* Progress */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs text-gray-500">{currentIndex + 1} of {jobs.length}</span>
                  <div className="flex-1 mx-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0A6A47] rounded-full transition-all duration-300"
                      style={{ width: `${((currentIndex) / jobs.length) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{jobs.length - currentIndex} left</span>
                </div>

                {/* Card Stack */}
                <div className="relative h-[520px] mb-5">
                  <AnimatePresence>
                    {remainingJobs.slice(0, 3).map((job, i) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        isTop={i === 0}
                        index={i}
                        onSwipeLeft={handleSwipeLeft}
                        onSwipeRight={handleSwipeRight}
                        onSave={handleSaveJob}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-4">
                  {/* Skip */}
                  <button onClick={handleSwipeLeft}
                    className="w-14 h-14 bg-white border-2 border-red-200 text-red-400 rounded-full flex items-center justify-center shadow-md hover:border-red-400 hover:text-red-500 hover:scale-110 transition-all">
                    <X className="w-6 h-6" />
                  </button>

                  {/* Undo */}
                  {currentIndex > 0 && (
                    <button onClick={handleUndo}
                      className="w-10 h-10 bg-white border border-gray-200 text-gray-400 rounded-full flex items-center justify-center shadow-sm hover:border-gray-400 hover:scale-110 transition-all">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}

                  {/* Apply */}
                  <button onClick={handleSwipeRight}
                    className="w-14 h-14 bg-gradient-to-br from-[#0A6A47] to-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-110 transition-all">
                    <Heart className="w-6 h-6" />
                  </button>
                </div>

                {/* Hint */}
                <p className="text-center text-xs text-gray-400 mt-3">
                  ← Swipe left to skip · Swipe right to apply →
                </p>
              </>
            )}
          </>
        )}

        {/* Empty state */}
        {!hasSearched && resume && (
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
            <Sparkles className="w-10 h-10 text-[#0A6A47] mx-auto mb-3" />
            <p className="text-gray-900 font-semibold">Ready to find jobs</p>
            <p className="text-gray-500 text-sm mt-1">Click &ldquo;Find&rdquo; to get AI-matched results</p>
          </div>
        )}
      </div>
    </div>
  )
}
