'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  FileText,
  Download,
  Trash2,
  Calendar,
  Briefcase,
  GraduationCap,
  Code,
  FolderGit2,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

interface Resume {
  id: string
  file_name: string
  file_url: string
  file_size: number
  mime_type: string
  parsed_name: string | null
  extracted_skills: string[]
  extracted_projects: Array<{
    title: string
    description: string
    technologies: string[]
  }>
  extracted_education: Array<{
    degree: string
    institution: string
    year: string
    gpa?: string
  }>
  extracted_experience: Array<{
    title: string
    company: string
    duration: string
    description: string
  }>
  raw_text: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function ResumeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const resumeId = params.id as string

  const [resume, setResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'raw'>('overview')

  useEffect(() => {
    if (resumeId) {
      fetchResume()
    }
  }, [resumeId])

  const fetchResume = async () => {
    try {
      const response = await fetch(`/api/careers/resumes/${resumeId}`)
      if (response.ok) {
        const data = await response.json()
        setResume(data)
      } else {
        toast.error('Failed to load resume')
        router.push('/careers/resume')
      }
    } catch (error) {
      console.error('Failed to fetch resume:', error)
      toast.error('Failed to load resume')
      router.push('/careers/resume')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this resume?')) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/careers/resumes/${resumeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Resume deleted successfully')
        router.push('/careers/resume')
      } else {
        toast.error('Failed to delete resume')
      }
    } catch (error) {
      console.error('Failed to delete resume:', error)
      toast.error('Failed to delete resume')
    } finally {
      setDeleting(false)
    }
  }

  const handleDownload = () => {
    if (resume?.file_url) {
      window.open(resume.file_url, '_blank')
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

  if (!resume) {
    return null
  }

  const isParsed = resume.extracted_skills.length > 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/careers/resume')}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Resumes
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <FileText className="h-10 w-10 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {resume.parsed_name || resume.file_name}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Uploaded {format(new Date(resume.created_at), 'MMM d, yyyy')}
                  </span>
                  <span>•</span>
                  <span>{formatFileSize(resume.file_size)}</span>
                  <span>•</span>
                  <span>{resume.mime_type.includes('pdf') ? 'PDF' : 'DOCX'}</span>
                </div>
                <div className="mt-2">
                  {isParsed ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Successfully parsed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Parsing in progress...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'border-[#0A6A47] text-[#0A6A47]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'raw'
                  ? 'border-[#0A6A47] text-[#0A6A47]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Raw Text
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' ? (
          <div className="space-y-6">
            {/* Skills */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Code className="h-6 w-6 text-[#0A6A47]" />
                <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
                <span className="text-sm text-gray-500">
                  ({resume.extracted_skills.length})
                </span>
              </div>
              {resume.extracted_skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {resume.extracted_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No skills extracted yet</p>
              )}
            </div>

            {/* Experience */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="h-6 w-6 text-[#0A6A47]" />
                <h2 className="text-xl font-semibold text-gray-900">Experience</h2>
                <span className="text-sm text-gray-500">
                  ({resume.extracted_experience.length})
                </span>
              </div>
              {resume.extracted_experience.length > 0 ? (
                <div className="space-y-4">
                  {resume.extracted_experience.map((exp, idx) => (
                    <div key={idx} className="border-l-2 border-[#0A6A47] pl-4">
                      <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {exp.company} • {exp.duration}
                      </p>
                      <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No experience extracted yet</p>
              )}
            </div>

            {/* Education */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="h-6 w-6 text-[#0A6A47]" />
                <h2 className="text-xl font-semibold text-gray-900">Education</h2>
                <span className="text-sm text-gray-500">
                  ({resume.extracted_education.length})
                </span>
              </div>
              {resume.extracted_education.length > 0 ? (
                <div className="space-y-4">
                  {resume.extracted_education.map((edu, idx) => (
                    <div key={idx} className="border-l-2 border-[#0A6A47] pl-4">
                      <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {edu.institution} • {edu.year}
                      </p>
                      {edu.gpa && (
                        <p className="text-sm text-gray-700 mt-1">GPA: {edu.gpa}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No education extracted yet</p>
              )}
            </div>

            {/* Projects */}
            {resume.extracted_projects.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FolderGit2 className="h-6 w-6 text-[#0A6A47]" />
                  <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
                  <span className="text-sm text-gray-500">
                    ({resume.extracted_projects.length})
                  </span>
                </div>
                <div className="space-y-4">
                  {resume.extracted_projects.map((project, idx) => (
                    <div key={idx} className="border-l-2 border-[#0A6A47] pl-4">
                      <h3 className="font-semibold text-gray-900">{project.title}</h3>
                      <p className="text-sm text-gray-700 mt-2">{project.description}</p>
                      {project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.technologies.map((tech, techIdx) => (
                            <span
                              key={techIdx}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Raw Text</h2>
            {resume.raw_text ? (
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto">
                {resume.raw_text}
              </pre>
            ) : (
              <p className="text-gray-500">Raw text not available yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
