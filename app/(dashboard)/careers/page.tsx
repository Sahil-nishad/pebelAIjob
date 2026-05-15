'use client'

import { useRouter } from 'next/navigation'
import {
  Upload,
  Search,
  Sparkles,
  FileText,
  Bookmark,
} from 'lucide-react'

export default function CareersPage() {
  const router = useRouter()

  const quickActions = [
    {
      icon: Upload,
      title: 'Upload Resume',
      description: 'Upload your resume for AI parsing',
      href: '/careers/resume',
      color: 'bg-blue-500',
    },
    {
      icon: Search,
      title: 'Find Jobs',
      description: 'AI matches jobs to your resume',
      href: '/careers/jobs',
      color: 'bg-[#0A6A47]',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Job Search</h1>
          <p className="text-gray-600 mt-2">
            Upload your resume and find perfectly matched jobs using AI
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={() => router.push(action.href)}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md hover:border-[#0A6A47] transition-all text-left group"
            >
              <div className={`${action.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <action.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-gray-600">{action.description}</p>
            </button>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-r from-[#0A6A47] to-[#0d8a5a] rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 font-bold text-lg">
                1
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1">Upload Resume</h4>
                <p className="text-sm text-white/80">
                  AI extracts your skills, experience, and target role
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 font-bold text-lg">
                2
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1">AI Matches Jobs</h4>
                <p className="text-sm text-white/80">
                  Searches Naukri, Indeed, LinkedIn & more — scores each job
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 font-bold text-lg">
                3
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1">Apply with Confidence</h4>
                <p className="text-sm text-white/80">
                  See match %, missing skills, and apply directly
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
