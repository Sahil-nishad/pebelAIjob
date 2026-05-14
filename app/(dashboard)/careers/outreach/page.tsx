'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Mail,
  TrendingUp,
  Pause,
  Play,
  Trash2,
  BarChart3,
  Loader2,
  CheckCircle,
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
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/careers/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    
    try {
      const response = await fetch(`/api/careers/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success(`Campaign ${newStatus === 'active' ? 'activated' : 'paused'}`)
        fetchCampaigns()
      } else {
        toast.error('Failed to update campaign')
      }
    } catch (error) {
      console.error('Failed to update campaign:', error)
      toast.error('Failed to update campaign')
    }
  }

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const response = await fetch(`/api/careers/campaigns/${campaignId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Campaign deleted')
        fetchCampaigns()
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600 mt-2">
              Organize and track your outreach efforts
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#0A6A47] text-white px-6 py-3 rounded-lg hover:bg-[#085a3a] transition-colors font-semibold"
          >
            <Plus className="h-5 w-5" />
            New Campaign
          </button>
        </div>

        {/* Campaigns List */}
        {campaigns.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {campaign.name}
                    </h3>
                    {campaign.description && (
                      <p className="text-sm text-gray-600">{campaign.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
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
                </div>

                {/* Target Info */}
                {(campaign.target_role || campaign.target_location) && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    {campaign.target_role && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Role:</span> {campaign.target_role}
                      </p>
                    )}
                    {campaign.target_location && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Location:</span> {campaign.target_location}
                      </p>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Sent</p>
                    <p className="text-xl font-bold text-gray-900">
                      {campaign.total_emails_sent}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Opened</p>
                    <p className="text-xl font-bold text-blue-600">
                      {campaign.total_opened}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Replied</p>
                    <p className="text-xl font-bold text-green-600">
                      {campaign.total_replied}
                    </p>
                  </div>
                </div>

                {/* Daily Limit */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Today's Progress</span>
                    <span className="text-gray-900 font-medium">
                      {campaign.emails_sent_today} / {campaign.daily_limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#0A6A47] h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((campaign.emails_sent_today / campaign.daily_limit) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => router.push(`/careers/outreach/${campaign.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <BarChart3 className="h-4 w-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => handleStatusToggle(campaign.id, campaign.status)}
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    {campaign.status === 'active' ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No campaigns yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first campaign to organize your outreach efforts
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-[#0A6A47] text-white px-6 py-3 rounded-lg hover:bg-[#085a3a] transition-colors font-semibold"
            >
              <Plus className="h-5 w-5" />
              Create Campaign
            </button>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <CreateCampaignModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              fetchCampaigns()
            }}
          />
        )}
      </div>
    </div>
  )
}

function CreateCampaignModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [targetLocation, setTargetLocation] = useState('')
  const [dailyLimit, setDailyLimit] = useState(5)
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter a campaign name')
      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/careers/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          target_role: targetRole.trim() || null,
          target_location: targetLocation.trim() || null,
          daily_limit: dailyLimit,
        }),
      })

      if (response.ok) {
        toast.success('Campaign created successfully')
        onSuccess()
      } else {
        toast.error('Failed to create campaign')
      }
    } catch (error) {
      console.error('Failed to create campaign:', error)
      toast.error('Failed to create campaign')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Campaign</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Software Engineer Outreach"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this campaign..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Software Engineer"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Location
            </label>
            <input
              type="text"
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
              placeholder="e.g., San Francisco, Remote"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Email Limit
            </label>
            <input
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(parseInt(e.target.value) || 5)}
              min="1"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum emails to send per day (1-100)
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0A6A47] text-white px-6 py-3 rounded-lg hover:bg-[#085a3a] transition-colors font-semibold disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Campaign'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
