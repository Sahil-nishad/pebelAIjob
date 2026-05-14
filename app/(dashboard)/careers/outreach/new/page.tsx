'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Mail,
  Loader2,
  Sparkles,
  Send,
  ArrowLeft,
  FileText,
  User,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Resume {
  id: string
  file_name: string
  parsed_name: string | null
  extracted_skills: string[]
}

interface Recruiter {
  id: string
  recruiter_name: string
  company: string | null
  designation: string | null
}

export default function NewOutreachPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const recruiterId = searchParams.get('recruiter')

  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null)
  const [tone, setTone] = useState<'professional' | 'casual' | 'enthusiastic'>('professional')
  const [customInstructions, setCustomInstructions] = useState('')
  
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [matchPercentage, setMatchPercentage] = useState(0)
  const [missingSkills, setMissingSkills] = useState<string[]>([])

  const [gmailConnected, setGmailConnected] = useState(false)
  const [checkingGmail, setCheckingGmail] = useState(true)

  useEffect(() => {
    fetchResumes()
    checkGmailStatus()
    if (recruiterId) {
      fetchRecruiter(recruiterId)
    }
  }, [recruiterId])

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/careers/resumes')
      if (response.ok) {
        const data = await response.json()
        setResumes(data.filter((r: Resume) => r.extracted_skills.length > 0))
        if (data.length > 0) {
          setSelectedResumeId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error)
    }
  }

  const fetchRecruiter = async (id: string) => {
    try {
      const response = await fetch(`/api/careers/recruiters/${id}`)
      if (response.ok) {
        const data = await response.json()
        setRecruiter(data)
      }
    } catch (error) {
      console.error('Failed to fetch recruiter:', error)
    }
  }

  const checkGmailStatus = async () => {
    try {
      const response = await fetch('/api/careers/gmail/status')
      if (response.ok) {
        const data = await response.json()
        setGmailConnected(data.connected)
      }
    } catch (error) {
      console.error('Failed to check Gmail status:', error)
    } finally {
      setCheckingGmail(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedResumeId) {
      toast.error('Please select a resume')
      return
    }

    if (!recruiterId) {
      toast.error('No recruiter selected')
      return
    }

    setGenerating(true)

    try {
      const response = await fetch('/api/careers/emails/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiter_id: recruiterId,
          resume_id: selectedResumeId,
          tone,
          custom_instructions: customInstructions || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSubject(data.subject || '')
        setBody(data.body || '')
        setMatchPercentage(data.match_percentage || 0)
        setMissingSkills(data.missing_skills || [])
        setGenerated(true)
        toast.success('Email generated successfully!')
      } else {
        toast.error(data.error || 'Failed to generate email')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate email')
    } finally {
      setGenerating(false)
    }
  }

  const handleConnectGmail = async () => {
    try {
      const response = await fetch('/api/careers/gmail/authorize')
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.authorization_url
      } else {
        toast.error('Failed to initiate Gmail connection')
      }
    } catch (error) {
      console.error('Gmail connect error:', error)
      toast.error('Failed to connect Gmail')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Generate Outreach Email</h1>
          <p className="text-gray-600 mt-2">
            Create a personalized cold email with AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recruiter Info */}
            {recruiter && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Recruiter
                </h3>
                <div>
                  <p className="font-medium text-gray-900">{recruiter.recruiter_name}</p>
                  {recruiter.designation && (
                    <p className="text-sm text-gray-600 mt-1">{recruiter.designation}</p>
                  )}
                  {recruiter.company && (
                    <p className="text-sm text-gray-600">{recruiter.company}</p>
                  )}
                </div>
              </div>
            )}

            {/* Resume Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Select Resume
              </h3>
              {resumes.length > 0 ? (
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent"
                >
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.parsed_name || resume.file_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-3">No resumes found</p>
                  <button
                    onClick={() => router.push('/careers/resume/upload')}
                    className="text-sm text-[#0A6A47] hover:underline"
                  >
                    Upload Resume
                  </button>
                </div>
              )}
            </div>

            {/* Tone Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Email Tone</h3>
              <div className="space-y-2">
                {[
                  { value: 'professional', label: 'Professional', desc: 'Formal and business-like' },
                  { value: 'casual', label: 'Casual', desc: 'Friendly and approachable' },
                  { value: 'enthusiastic', label: 'Enthusiastic', desc: 'Energetic and passionate' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="tone"
                      value={option.value}
                      checked={tone === option.value}
                      onChange={(e) => setTone(e.target.value as any)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-600">{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Custom Instructions</h3>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Add any specific points you want to mention..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent resize-none"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedResumeId || !recruiterId}
              className="w-full flex items-center justify-center gap-2 bg-[#0A6A47] text-white px-6 py-3 rounded-lg hover:bg-[#085a3a] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Email
                </>
              )}
            </button>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Preview
              </h3>

              {!generated ? (
                <div className="text-center py-12">
                  <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Click "Generate Email" to create a personalized message
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Match Score */}
                  {matchPercentage > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-900">
                          ATS Match Score
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          {matchPercentage}%
                        </span>
                      </div>
                      {missingSkills.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-green-800 mb-2">Missing skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {missingSkills.slice(0, 5).map((skill, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-white text-green-700 px-2 py-1 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={12}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent resize-none font-mono text-sm"
                    />
                  </div>

                  {/* Gmail Connection Status */}
                  {!checkingGmail && (
                    <div>
                      {gmailConnected ? (
                        <div className="flex items-center gap-2 text-green-600 text-sm mb-4">
                          <CheckCircle className="h-4 w-4" />
                          <span>Gmail connected</span>
                        </div>
                      ) : (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-yellow-900 mb-2">
                                Gmail not connected
                              </p>
                              <p className="text-sm text-yellow-800 mb-3">
                                Connect your Gmail to send emails directly from your account
                              </p>
                              <button
                                onClick={handleConnectGmail}
                                className="text-sm bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                              >
                                Connect Gmail
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      <Sparkles className="h-4 w-4" />
                      Regenerate
                    </button>
                    <button
                      disabled={!gmailConnected}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#0A6A47] text-white px-6 py-3 rounded-lg hover:bg-[#085a3a] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                      Send Email
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
