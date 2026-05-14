'use client'

import { useState, useEffect } from 'react'
import {
  Mail,
  MailOpen,
  Reply,
  TrendingUp,
  Calendar,
  Target,
  Users,
  Loader2,
  FileText,
  Zap,
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

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
  recent_activity: Array<{
    type: string
    description: string
    timestamp: string
  }>
}

interface TimelineData {
  date: string
  emails_sent: number
  opened: number
  replied: number
}

interface TopCampaign {
  campaign_id: string
  campaign_name: string
  emails_sent: number
  opened: number
  replied: number
  open_rate: number
  reply_rate: number
}

interface TopRecruiter {
  recruiter_id: string
  recruiter_name: string
  company: string
  emails_sent: number
  opened: number
  replied: number
}

interface Analytics {
  total_emails_sent: number
  total_opened: number
  total_replied: number
  total_bounced: number
  open_rate: number
  reply_rate: number
  bounce_rate: number
  avg_response_time_hours: number | null
  timeline: TimelineData[]
  top_campaigns: TopCampaign[]
  top_recruiters: TopRecruiter[]
}

export default function AnalyticsPage() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(30) // days

  useEffect(() => {
    fetchData()
  }, [dateRange])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch dashboard stats
      const dashboardResponse = await fetch('/api/careers/analytics/dashboard')
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json()
        setDashboardStats(dashboardData)
      }

      // Fetch detailed analytics
      const endDate = new Date()
      const startDate = subDays(endDate, dateRange)

      const analyticsResponse = await fetch('/api/careers/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          group_by: 'day',
        }),
      })

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setAnalytics(analyticsData)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-2">
              Track your outreach performance and insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<FileText className="h-6 w-6" />}
              label="Total Resumes"
              value={dashboardStats.total_resumes}
              color="blue"
            />
            <StatCard
              icon={<Target className="h-6 w-6" />}
              label="Active Campaigns"
              value={dashboardStats.active_campaigns}
              color="green"
            />
            <StatCard
              icon={<Users className="h-6 w-6" />}
              label="Recruiters Found"
              value={dashboardStats.total_recruiters_found}
              color="purple"
            />
            <StatCard
              icon={<Zap className="h-6 w-6" />}
              label="Emails Today"
              value={`${dashboardStats.emails_sent_today}/${dashboardStats.daily_limit}`}
              color="orange"
            />
          </div>
        )}

        {/* Performance Metrics */}
        {analytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <MetricCard
                icon={<Mail className="h-5 w-5" />}
                label="Total Sent"
                value={analytics.total_emails_sent}
                color="gray"
              />
              <MetricCard
                icon={<MailOpen className="h-5 w-5" />}
                label="Opened"
                value={analytics.total_opened}
                percentage={analytics.open_rate}
                color="blue"
              />
              <MetricCard
                icon={<Reply className="h-5 w-5" />}
                label="Replied"
                value={analytics.total_replied}
                percentage={analytics.reply_rate}
                color="green"
              />
              <MetricCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Avg Response Time"
                value={
                  analytics.avg_response_time_hours
                    ? `${Math.round(analytics.avg_response_time_hours)}h`
                    : 'N/A'
                }
                color="purple"
              />
            </div>

            {/* Timeline Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Email Activity Timeline
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="emails_sent"
                    stroke="#6b7280"
                    strokeWidth={2}
                    name="Sent"
                    dot={{ fill: '#6b7280', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="opened"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Opened"
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="replied"
                    stroke="#0A6A47"
                    strokeWidth={2}
                    name="Replied"
                    dot={{ fill: '#0A6A47', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top Campaigns & Recruiters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Campaigns */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Top Campaigns
                </h2>
                {analytics.top_campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.top_campaigns.map((campaign, index) => (
                      <div
                        key={campaign.campaign_id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-[#0A6A47] text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {campaign.campaign_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {campaign.emails_sent} sent · {campaign.opened} opened ·{' '}
                            {campaign.replied} replied
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-600">
                            {campaign.open_rate.toFixed(1)}% open
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            {campaign.reply_rate.toFixed(1)}% reply
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No campaign data yet
                  </p>
                )}
              </div>

              {/* Top Recruiters */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Top Recruiters
                </h2>
                {analytics.top_recruiters.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.top_recruiters.map((recruiter, index) => (
                      <div
                        key={recruiter.recruiter_id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {recruiter.recruiter_name}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {recruiter.company}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {recruiter.emails_sent} sent
                          </p>
                          <p className="text-xs text-gray-600">
                            {recruiter.opened} opened · {recruiter.replied} replied
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No recruiter data yet
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Recent Activity */}
        {dashboardStats && dashboardStats.recent_activity.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Recent Activity
            </h2>
            <div className="space-y-3">
              {dashboardStats.recent_activity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-2 h-2 bg-[#0A6A47] rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
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
