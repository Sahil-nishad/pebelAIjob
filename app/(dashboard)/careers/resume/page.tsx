'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface Resume {
  id: string
  file_name: string
  file_url: string
  file_size: number
  mime_type: string
  parsed_name: string | null
  extracted_skills: string[]
  extracted_experience: any[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function ResumePage() {
  const router = useRouter()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/careers/resumes')
      if (response.ok) {
        const data = await response.json()
        setResumes(data)
      } else {
        toast.error('Failed to load resumes')
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error)
      toast.error('Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return

    setDeleting(resumeId)
    try {
      const response = await fetch(`/api/careers/resumes/${resumeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Resume deleted successfully')
        setResumes(resumes.filter((r) => r.id !== resumeId))
      } else {
        toast.error('Failed to delete resume')
      }
    } catch (error) {
      console.error('Failed to delete resume:', error)
      toast.error('Failed to delete resume')
    } finally {
      setDeleting(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[#0A6A47]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Resumes</h1>
            <p className="text-gray-600 mt-2">
              Upload and manage your resumes for AI-powered outreach
            </p>
          </div>
          <button
            onClick={() => router.push('/careers/resume/upload')}
            className="flex items-center gap-2 bg-[#0A6A47] text-white px-6 py-3 rounded-lg hover:bg-[#085a3a] transition-colors font-semibold"
          >
            <Upload className="h-5 w-5" />
            Upload Resume
          </button>
        </div>

        {/* Empty State */}
        {resumes.length === 0 && (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No resumes yet
            </h3>
            <p className="text-gray-600 mb-6">
              Upload your first resume to start finding recruiters and generating personalized emails
            </p>
            <button
              onClick={() => router.push('/careers/resume/upload')}
              className="inline-flex items-center gap-2 bg-[#0A6A47] text-white px-6 py-3 rounded-lg hover:bg-[#085a3a] transition-colors font-semibold"
            >
              <Upload className="h-5 w-5" />
              Upload Your First Resume
            </button>
          </div>
        )}

        {/* Resume List */}
        {resumes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* File Icon & Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  {resume.extracted_skills.length > 0 ? (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Parsed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-orange-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Parsing...</span>
                    </div>
                  )}
                </div>

                {/* File Name */}
                <h3 className="font-semibold text-gray-900 mb-2 truncate">
                  {resume.parsed_name || resume.file_name}
                </h3>

                {/* File Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(resume.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatFileSize(resume.file_size)} • {resume.mime_type.includes('pdf') ? 'PDF' : 'DOCX'}
                  </div>
                </div>

                {/* Skills Preview */}
                {resume.extracted_skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Top Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {resume.extracted_skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {resume.extracted_skills.length > 3 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{resume.extracted_skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => router.push(`/careers/resume/${resume.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => handleDelete(resume.id)}
                    disabled={deleting === resume.id}
                    className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {deleting === resume.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {resumes.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Resumes</p>
                <p className="text-2xl font-bold text-gray-900">{resumes.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Parsed Resumes</p>
                <p className="text-2xl font-bold text-green-600">
                  {resumes.filter((r) => r.extracted_skills.length > 0).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Skills Extracted</p>
                <p className="text-2xl font-bold text-blue-600">
                  {resumes.reduce((acc, r) => acc + r.extracted_skills.length, 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
