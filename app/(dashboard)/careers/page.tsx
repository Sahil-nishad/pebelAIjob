'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Upload,
  Search,
  FileText,
  Loader2,
  ExternalLink,
  Bookmark,
  CheckCircle,
  AlertCircle,
  Sparkles,
  MapPin,
  Briefcase,
  Star,
  Globe,
  Building2,
  X,
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

export default function CareersPage() {
  const [resume, setResume] = useState<ResumeData | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loadingResume, setLoadingResume] = useState(true)
  const [searching, setSearching] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [location, setLocation] = useState('')
  const [totalFound, setTotalFound] = useState(0)

  // Load existing resume on mount
  useEffect(() => {
    fetchResume()
  }, [])

  const fetchResume = async () => {
    try {
      const response = await fetch('/api/careers/resumes?active_only=true')
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          setResume(data[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch resume:', error)
    } finally {
      setLoadingResume(false)
    }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/careers/resumes/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setResume(data)
        toast.success('Resume uploaded & parsed!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to upload')
      }
    } catch (error) {
      toast.error('Failed to upload resume')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF and DOCX files allowed')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB')
      return
    }

    handleUpload(file)
  }

  const handleSearch = async () => {
    if (!resume) {
      toast.error('Upload your resume first')
      return
    }

    setSearching(true)
    setHasSearched(true)

    try {
      const body: any = {
        resume_id: resume.id,
        top_n: 10,
      }
      if (location.trim()) body.location = location.trim()

      const response = await fetch('/api/careers/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data = await response.json()
        let results = data.jobs || []

        // Client-side filter for remote only
        if (remoteOnly) {
          results = results.filter((j: Job) => j.remote)
        }

        setJobs(results)
        setTotalFound(data.total_found || 0)

        if (results.length > 0) {
          toast.success(`Found ${results.length} matching jobs!`)
        } else {
          toast.error('No jobs found. Try changing filters.')
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Search failed')
      }
    } catch (error) {
      toast.error('Failed to search jobs')
    } finally {
      setSearching(false)
    }
  }

  const handleSaveJob = async (job: Job) => {
    try {
      const response = await fetch('/api/careers/jobs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      })
      if (response.ok) toast.success('Job saved!')
      else toast.error('Failed to save')
    } catch { toast.error('Failed to save') }
  }

  const removeResume = () => {
    setResume(null)
    setJobs([])
    setHasSearched(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-200'
    if (score >= 60) return 'bg-blue-100 text-blue-700 border-blue-200'
    if (score >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getSourceBadge = (source: string) => {
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

  // Parse skills from resume data
  const skills = (() => {
    if (!resume?.extracted_skills) return []
    const s = resume.extracted_skills
    if (typeof s === 'string') {
      try { return JSON.parse(s) } catch { return [] }
    }
    return Array.isArray(s) ? s : []
  })()

  if (loadingResume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0A6A47] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">AI Job Search</h1>
          <p className="text-gray-500 text-sm mt-1">Upload resume → Find perfectly matched jobs</p>
        </div>

        {/* Step 1: Resume */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 mb-4">
          {!resume ? (
            /* Upload State */
            <div className="text-center">
              <div className="w-14 h-14 bg-[#0A6A47]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-[#0A6A47]" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Upload Your Resume</h2>
              <p className="text-sm text-gray-500 mb-4">AI will extract your skills and find matching jobs</p>
              <label className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold cursor-pointer transition-all ${
                uploading ? 'bg-gray-200 text-gray-500' : 'bg-[#0A6A47] text-white hover:bg-[#085c3d]'
              }`}>
                {uploading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Parsing...</>
                ) : (
                  <><Upload className="w-5 h-5" /> Choose PDF or DOCX</>
                )}
                <input type="file" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" disabled={uploading} />
              </label>
            </div>
          ) : (
            /* Resume Loaded State */
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{resume.file_name}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Parsed successfully
                    </p>
                  </div>
                </div>
                <button onClick={removeResume} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Extracted Skills */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(0, 12).map((skill: string, i: number) => (
                    <span key={i} className="text-xs bg-[#0A6A47]/10 text-[#0A6A47] px-2.5 py-1 rounded-full font-medium">
                      {skill}
                    </span>
                  ))}
                  {skills.length > 12 && (
                    <span className="text-xs text-gray-400 px-2 py-1">+{skills.length - 12} more</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Filters + Search */}
        {resume && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 mb-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Location */}
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location (e.g., Noida, Bangalore)"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent"
                />
              </div>

              {/* Remote Toggle */}
              <button
                onClick={() => setRemoteOnly(!remoteOnly)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  remoteOnly
                    ? 'bg-[#0A6A47] text-white border-[#0A6A47]'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#0A6A47]'
                }`}
              >
                <Globe className="w-4 h-4" />
                Remote Only
              </button>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={searching}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0A6A47] text-white rounded-xl font-semibold text-sm hover:bg-[#085c3d] transition-colors disabled:opacity-50"
              >
                {searching ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
                ) : (
                  <><Search className="w-4 h-4" /> Find Jobs</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {hasSearched && (
          <div>
            {jobs.length > 0 && (
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">
                  Showing <strong>{jobs.length}</strong> of {totalFound} jobs
                </p>
                <span className="flex items-center gap-1 text-xs bg-[#0A6A47]/10 text-[#0A6A47] px-2.5 py-1 rounded-full font-medium">
                  <Sparkles className="w-3 h-3" /> AI Ranked
                </span>
              </div>
            )}

            {jobs.length > 0 ? (
              <div className="space-y-3">
                {jobs.map((job) => {
                  const badge = getSourceBadge(job.source)
                  return (
                    <div key={job.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        {/* Score */}
                        {job.match_score !== null && (
                          <div className={`flex-shrink-0 w-12 h-12 rounded-xl border flex flex-col items-center justify-center ${getScoreColor(job.match_score)}`}>
                            <span className="text-sm font-bold">{job.match_score}%</span>
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm md:text-base">{job.title}</h3>
                              <p className="text-gray-600 text-sm">{job.company}</p>
                            </div>
                            <span className={`flex-shrink-0 text-[9px] text-white px-2 py-0.5 rounded-full uppercase font-bold ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </div>

                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location || 'India'}</span>
                            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.salary}</span>
                            {job.remote && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-medium">Remote</span>}
                          </div>

                          {/* AI Insight */}
                          {job.why_good_fit && (
                            <p className="mt-2 text-xs text-gray-600 italic bg-gray-50 px-3 py-1.5 rounded-lg">
                              &ldquo;{job.why_good_fit}&rdquo;
                            </p>
                          )}

                          {/* Skills */}
                          {(job.matching_skills?.length > 0 || job.missing_skills?.length > 0) && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {job.matching_skills?.slice(0, 4).map((s) => (
                                <span key={s} className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">✓ {s}</span>
                              ))}
                              {job.missing_skills?.slice(0, 2).map((s) => (
                                <span key={s} className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">✗ {s}</span>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3">
                            <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 bg-[#0A6A47] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#085c3d] transition-colors">
                              <ExternalLink className="w-3 h-3" /> Apply
                            </a>
                            <button onClick={() => handleSaveJob(job)}
                              className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">
                              <Bookmark className="w-3 h-3" /> Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
                <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No jobs found</p>
                <p className="text-gray-400 text-sm mt-1">Try changing location or disable remote filter</p>
              </div>
            )}
          </div>
        )}

        {/* Empty state before search */}
        {!hasSearched && resume && (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
            <Sparkles className="w-10 h-10 text-[#0A6A47] mx-auto mb-3" />
            <p className="text-gray-900 font-semibold">Ready to find jobs</p>
            <p className="text-gray-500 text-sm mt-1">Click &ldquo;Find Jobs&rdquo; to get AI-matched results</p>
          </div>
        )}
      </div>
    </div>
  )
}
