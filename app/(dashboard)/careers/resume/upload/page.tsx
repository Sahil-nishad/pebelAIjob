'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function ResumeUploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF and DOCX files are allowed'
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return 'File size must be less than 10MB'
    }

    return null
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      const error = validateFile(droppedFile)
      
      if (error) {
        toast.error(error)
        return
      }

      setFile(droppedFile)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const error = validateFile(selectedFile)
      
      if (error) {
        toast.error(error)
        return
      }

      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress (since we can't track actual upload progress easily)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/careers/resumes/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const data = await response.json()
        toast.success('Resume uploaded successfully! Parsing in progress...')
        
        // Wait a moment to show 100% progress
        setTimeout(() => {
          router.push(`/careers/resume/${data.id}`)
        }, 500)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to upload resume')
        setUploadProgress(0)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload resume')
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Upload Resume</h1>
          <p className="text-gray-600 mt-2">
            Upload your resume to extract skills and experience for AI-powered outreach
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {!file ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive
                  ? 'border-[#0A6A47] bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload
                className={`h-16 w-16 mx-auto mb-4 ${
                  dragActive ? 'text-[#0A6A47]' : 'text-gray-400'
                }`}
              />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Drop your resume here
              </h3>
              <p className="text-gray-600 mb-6">
                or click to browse from your computer
              </p>
              <label className="inline-flex items-center gap-2 bg-[#0A6A47] text-white px-6 py-3 rounded-lg hover:bg-[#085a3a] transition-colors font-semibold cursor-pointer">
                <Upload className="h-5 w-5" />
                Choose File
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-4">
                Supported formats: PDF, DOCX (max 10MB)
              </p>
            </div>
          ) : (
            <div>
              {/* File Preview */}
              <div className="border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {file.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatFileSize(file.size)} • {file.type.includes('pdf') ? 'PDF' : 'DOCX'}
                    </p>
                    {uploading && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Uploading...</span>
                          <span className="text-[#0A6A47] font-semibold">
                            {uploadProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#0A6A47] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {!uploading && (
                    <button
                      onClick={() => setFile(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#0A6A47] text-white px-6 py-3 rounded-lg hover:bg-[#085a3a] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Upload Resume
                    </>
                  )}
                </button>
                {!uploading && (
                  <button
                    onClick={() => setFile(null)}
                    className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">AI Parsing</h4>
            </div>
            <p className="text-sm text-gray-600">
              Our AI extracts skills, experience, and education automatically
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">Secure Storage</h4>
            </div>
            <p className="text-sm text-gray-600">
              Your resume is stored securely and only accessible by you
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">ATS Matching</h4>
            </div>
            <p className="text-sm text-gray-600">
              Compare your skills with job requirements automatically
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Tips for best results:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use a well-formatted PDF or DOCX file</li>
                <li>• Include clear section headers (Experience, Education, Skills)</li>
                <li>• List your skills explicitly</li>
                <li>• Avoid images or complex formatting</li>
                <li>• Keep file size under 10MB</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
