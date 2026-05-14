'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Mail,
  MailOpen,
  Reply,
  Clock,
  TrendingUp,
  Pause,
  Play,
  Trash2,
  Loader2,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

interface Campaign {
  id: string
  name: string
  description: string | null
  target_role: string | null
  target_location: string | null
  status: string
  daily_limit: number
  emails_sent_today: number
  total_emails_sent: number
  total_opened: number
  total_replied: number
  created_at: string
  updated_at: string
}

interface CampaignStats {
  campaign_id: string
  total_emails_sent: number
  total_opened: number
  total_replied: number
  total_bounced: number
  open_rate: number
  reply_rate: number
  bounce_rate: number
  avg_response_time_hours: number | null
}

interface Email {
  id: string
  recruiter_id: string
  recruiter_name: string
  recruiter_company: string
  subject: string
  status: string
  sent_at: string
  opened_at: string | null
  replied_at: string | null
  bounced_at: string | null
}

export default function CampaignDetailPage() {
  const router = useRouter()
  const params = useParams()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [emailsLoading, setEmailsLoading] = useState(true)

  useEffect(() => {
    fetchCampaignData()
    fetchEmails()
  }, [campaignId])

  const fetchCampaignData = async () => {
    try {
      // Fetch campaign details
      const campaignResponse = await fetch(`/api/careers/campaigns/${campaignId}`)
      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json()
        setCampaign(campaignData)
      }

      // Fetch campaign stats
      const statsResponse = await fetch(`/api/careers/campaigns/${campaignId}/stats`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Failed to fetch campaign data:', error)
      toast.error('Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmails = async () => {
    try {
      const response = await fetch(`/api/careers/emails?campaign_id=${campaignId}`)
      if (response.ok) {
        const data = await response.json()
        setEmails(data)
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error)
    } finally {
      setEmailsLoading(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!campaign) return

    const newStatus = campaign.status === 'active' ? 'paused' : 'active'

    try {
      const response = await fetch(`/api/careers/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success(`Campaign ${newStatus === 'active' ? 'activated' : 'paused'}`)
        fetchCampaignData()
      } else {
        toast.error('Failed to update campaign')
      }
    } catch (error) {
      console.error('Failed to update campaign:', error)
      toast.error('Failed to update campaign')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/careers/campaigns/${campaignId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Campaign deleted')
        router.push('/careers/outreach')
      } else {
        toast.error('Failed to delete campaign')
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error)
      toast.error('Failed to delete campaign')
    }
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

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Campaign not found</p>
            <button
              onClick={() => router.push('/careers/outreach')}
              className="mt-4 text-[#0A6A47] hover:underline"
            >
              Back to Campaigns
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/careers/outreach')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
                {campaign.status === 'active' ? (
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    Paused
                  </span>
                )}
              </div>
              {campaign.description && (
                <p className="text-gray-600">{campaign.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Created {format(new Date(campaign.created_at), 'MMM d, yyyy')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStatusToggle}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                {campaign.status === 'active' ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Activate
                  </>
                )}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Target Info */}
        {(campaign.target_role || campaign.target_location) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Target Criteria</h2>
            <div className="grid grid-cols-2 gap-4">
              {campaign.target_role && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Role</p>
                  <p className="text-gray-900 font-medium">{campaign.target_role}</p>
                </div>
              )}
              {campaign.target_location && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="text-gray-900 font-medium">{campaign.target_location}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<Mail className="h-5 w-5" />}
              label="Total Sent"
              value={stats.total_emails_sent}
              color="gray"
            />
            <StatCard
              icon={<MailOpen className="h-5 w-5" />}
              label="Opened"
              value={stats.total_opened}
              percentage={stats.open_rate}
              color="blue"
            />
            <StatCard
              icon={<Reply className="h-5 w-5" />}
              label="Replied"
              value={stats.total_replied}
              percentage={stats.reply_rate}
              color="green"
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="Avg Response"
              value={
                stats.avg_response_time_hours
                  ? `${Math.round(stats.avg_response_time_hours)}h`
                  : 'N/A'
              }
              color="purple"
            />
          </div>
        )}

        {/* Daily Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Progress</h2>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Emails sent today</span>
            <span className="text-gray-900 font-medium">
              {campaign.emails_sent_today} / {campaign.daily_limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-[#0A6A47] h-3 rounded-full transition-all"
              style={{
                width: `${Math.min((campaign.emails_sent_today / campaign.daily_limit) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Emails List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sent Emails</h2>

          {emailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#0A6A47]" />
            </div>
          ) : emails.length > 0 ? (
            <div className="space-y-3">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {email.replied_at ? (
                      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <Reply className="h-5 w-5" />
                      </div>
                    ) : email.opened_at ? (
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <MailOpen className="h-5 w-5" />
                      </div>
                    ) : email.bounced_at ? (
                      <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                        <XCircle className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {email.recruiter_name}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {email.recruiter_company}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{email.subject}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {format(new Date(email.sent_at), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(email.sent_at), 'h:mm a')}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {email.replied_at && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Replied
                      </span>
                    )}
                    {email.opened_at && !email.replied_at && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        Opened
                      </span>
                    )}
                    {email.bounced_at && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                        Bounced
                      </span>
                    )}
                    {!email.opened_at && !email.replied_at && !email.bounced_at && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        Sent
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No emails sent yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  percentage,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  percentage?: number
  color: string
}) {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {percentage !== undefined && (
          <p className="text-sm text-gray-600">({percentage.toFixed(1)}%)</p>
        )}
      </div>
    </div>
  )
}
