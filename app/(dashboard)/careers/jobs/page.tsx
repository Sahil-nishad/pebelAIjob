'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  MapPin,
  Briefcase,
  Loader2,
  ExternalLink,
  Bookmark,
  Star,
  CheckCircle,
  AlertCircle,
  Sparkles,
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

interface Resume {
  id: string
  original_name: string
  parsed_skills: string[]
  parsed_summary: string
}

export default function JobSearchPage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResume, setSelectedResume] = useState<string>('')
  const [keywords, setKeywords] = useState('')
  const [location, setLocation] = useState('')
  const [searching, setSearching] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [totalFound, setTotalFound] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [aiMatched, setAiMatched] = useState(false)

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/careers/resumes?active_only=true')
      if (response.ok) {
        const data = await response.json()
        setResumes(data)
        if (data.length > 0) {
          setSelectedResume(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error)
    }
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!selectedResume && !keywords.trim()) {
      toast.error('Select a resume or enter keywords')
      return
    }

    setSearching(true)
    setHasSearched(true)

    try {
      const body: any = {
        top_n: 10,
        location: location.trim(),
      }

      if (selectedResume) {
        body.resume_id = selectedResume
      }
      if (keywords.trim()) {
        body.keywords = keywords.trim()
      }

      const response = await fetch('/api/careers/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
        setTotalFound(data.total_found || 0)
        setAiMatched(data.ai_matched || false)

        if (data.jobs?.length > 0) {
          toast.success(`Found ${data.jobs.length} matching jobs!`)
        } else {
          toast.error('No jobs found. Try different keywords.')
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
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

      if (response.ok) {
        toast.success('Job saved!')
      } else {
        toast.error('Failed to save job')
      }
    } catch (error) {
      toast.error('Failed to save job')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-200'
    if (score >= 60) return 'bg-blue-100 text-blue-700 border-blue-200'
    if (score >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getSourceBadge = (source: string) => {
    const badges: Record<string, string> = {
      naukri: 'bg-blue-600',
      adzuna: 'bg-purple-600',
      remotive: 'bg-green-600',
      jsearch: 'bg-orange-600',
    }
    return badges[source] || 'bg-gray-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Job Search</h1>
          <p className="text-gray-600 mt-2">
            Find jobs perfectly matched to your resume using AI
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Resume Selector */}
            {resumes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Sparkles className="inline h-4 w-4 mr-1 text-[#0A6A47]" />
                  Match against your resume
                </label>
                <select
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent"
                >
                  <option value="">Don&apos;t use resume (keyword search only)</option>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.original_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords (optional if resume selected)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g., Data Analyst, Python Developer"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Noida, Bangalore, Remote"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={searching}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#0A6A47] text-white px-8 py-3 rounded-lg hover:bg-[#085a3a] transition-colors font-semibold disabled:opacity-50"
            >
              {searching ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Searching & Matching...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Find Matching Jobs
                </>
              )}
            </button>
          </form>

          {resumes.length === 0 && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                Upload a resume first for AI-powered matching. Without a resume, only keyword search is available.
              </p>
            </div>
          )}
        </div>

        {/* Results */}
        {hasSearched && (
          <div>
            {/* Results Header */}
            {jobs.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {aiMatched ? 'AI-Matched Jobs' : 'Search Results'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Showing top {jobs.length} of {totalFound} jobs found
                  </p>
                </div>
                {aiMatched && (
                  <span className="flex items-center gap-1 text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    <Sparkles className="h-4 w-4" />
                    AI Ranked
                  </span>
                )}
              </div>
            )}

            {/* Job Cards */}
            {jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Match Score */}
                      {job.match_score !== null && (
                        <div className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center ${getScoreColor(job.match_score)}`}>
                          <span className="text-lg font-bold">{job.match_score}%</span>
                          <span className="text-[10px] uppercase font-medium">match</span>
                        </div>
                      )}

                      {/* Job Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {job.title}
                            </h3>
                            <p className="text-gray-700 font-medium">{job.company}</p>
                          </div>
                          <span className={`flex-shrink-0 text-[10px] text-white px-2 py-1 rounded-full uppercase font-bold ${getSourceBadge(job.source)}`}>
                            {job.source}
                          </span>
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.location || 'Not specified'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            {job.salary}
                          </span>
                          {job.experience_required && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5" />
                              {job.experience_required}
                            </span>
                          )}
                          {job.remote && (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                              Remote
                            </span>
                          )}
                        </div>

                        {/* AI Match Info */}
                        {job.why_good_fit && (
                          <p className="mt-3 text-sm text-gray-700 italic bg-gray-50 px-3 py-2 rounded-lg">
                            &ldquo;{job.why_good_fit}&rdquo;
                          </p>
                        )}

                        {/* Skills */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {job.matching_skills?.map((skill) => (
                            <span
                              key={skill}
                              className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200"
                            >
                              <CheckCircle className="h-3 w-3" />
                              {skill}
                            </span>
                          ))}
                          {job.missing_skills?.map((skill) => (
                            <span
                              key={skill}
                              className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full border border-orange-200"
                            >
                              <AlertCircle className="h-3 w-3" />
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4">
                          <a
                            href={job.apply_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-[#0A6A47] text-white px-5 py-2 rounded-lg hover:bg-[#085a3a] transition-colors text-sm font-semibold"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Apply Now
                          </a>
                          <button
                            onClick={() => handleSaveJob(job)}
                            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                          >
                            <Bookmark className="h-4 w-4" />
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-600">
                  Try different keywords or change your location
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <Sparkles className="h-16 w-16 text-[#0A6A47] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              AI-Powered Job Matching
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Select your resume and click &ldquo;Find Matching Jobs&rdquo; to get
              personalized job recommendations scored by AI
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
