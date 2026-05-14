'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload,
  Search,
  Mail,
  TrendingUp,
  FileText,
  Users,
  Send,
  BarChart3,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DashboardStats {
  total_resumes: number
  active_campaigns: number
  total_recruiters_found: number
  emails_sent_today: number
  daily_limit: number
  total_emails_sent: number
  total_opened: number
  total_replied: number
  open_rate: number
  reply_rate: number
}

export default function CareersPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/careers/analytics/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      icon: Upload,
      title: 'Upload Resume',
      description: 'Upload and parse your resume',
      href: '/careers/resume',
      color: 'bg-blue-500',
    },
    {
      icon: Search,
      title: 'Find Recruiters',
      description: 'Search for recruiters on LinkedIn',
      href: '/careers/recruiters',
      color: 'bg-purple-500',
    },
    {
      icon: Mail,
      title: 'Create Campaign',
      description: 'Start a new outreach campaign',
      href: '/careers/outreach',
      color: 'bg-green-500',
    },
    {
      icon: BarChart3,
      title: 'View Analytics',
      description: 'Track your outreach performance',
      href: '/careers/analytics',
      color: 'bg-orange-500',
    },
  ]

  const statCards = [
    {
      label: 'Resumes',
      value: stats?.total_resumes || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Recruiters Found',
      value: stats?.total_recruiters_found || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Emails Sent',
      value: stats?.total_emails_sent || 0,
      icon: Send,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Reply Rate',
      value: `${(stats?.reply_rate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Recruiter Outreach</h1>
          <p className="text-gray-600 mt-2">
            Automate your job search with AI-powered recruiter outreach
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Daily Limit Progress */}
        {stats && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Today's Sending Limit</h3>
              <span className="text-sm text-gray-600">
                {stats.emails_sent_today} / {stats.daily_limit} emails sent
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-[#0A6A47] h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((stats.emails_sent_today / stats.daily_limit) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => router.push(action.href)}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-[#0A6A47] transition-all text-left group"
              >
                <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-gradient-to-r from-[#0A6A47] to-[#0d8a5a] rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-3">Getting Started</h2>
          <p className="text-white/90 mb-6">
            Follow these steps to start your AI-powered recruiter outreach:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">Upload Your Resume</h4>
                <p className="text-sm text-white/80">
                  Our AI will extract your skills and experience
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">Find Recruiters</h4>
                <p className="text-sm text-white/80">
                  Search LinkedIn for recruiters in your target role
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">Send Personalized Emails</h4>
                <p className="text-sm text-white/80">
                  AI generates custom emails for each recruiter
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
