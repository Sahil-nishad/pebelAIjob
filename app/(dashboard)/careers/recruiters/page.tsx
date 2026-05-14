'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  MapPin,
  Briefcase,
  Mail,
  Linkedin,
  Loader2,
  Users,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Recruiter {
  id: string
  recruiter_name: string
  company: string | null
  email: string | null
  linkedin_url: string | null
  designation: string | null
  profile_image_url: string | null
  about: string | null
  followers_count: number | null
  is_verified: boolean
  created_at: string
}

export default function RecruitersPage() {
  const router = useRouter()
  const [keywords, setKeywords] = useState('')
  const [location, setLocation] = useState('')
  const [searching, setSearching] = useState(false)
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!keywords.trim()) {
      toast.error('Please enter search keywords')
      return
    }

    setSearching(true)
    setHasSearched(true)

    try {
      const response = await fetch('/api/careers/recruiters/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywords.trim(),
          location: location.trim() || null,
          limit: 10,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setRecruiters(data.recruiters || [])
        toast.success(`Found ${data.recruiters?.length || 0} recruiters`)
      } else {
        toast.error(data.message || 'Search failed')
        setRecruiters([])
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search recruiters')
      setRecruiters([])
    } finally {
      setSearching(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Recruiters</h1>
          <p className="text-gray-600 mt-2">
            Search LinkedIn for recruiters and hiring managers
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g., Software Engineer, Product Manager"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (optional)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., San Francisco, Remote"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A6A47] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={searching}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#0A6A47] text-white px-8 py-3 rounded-lg hover:bg-[#085a3a] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Searching LinkedIn...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Search Recruiters
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Be specific with your keywords. For example: "Software
              Engineer recruiter at Google" or "Product Manager hiring manager"
            </p>
          </div>
        </div>

        {/* Results */}
        {hasSearched && (
          <div>
            {recruiters.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Search Results ({recruiters.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recruiters.map((recruiter) => (
                    <div
                      key={recruiter.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      {/* Profile */}
                      <div className="flex items-start gap-4 mb-4">
                        {recruiter.profile_image_url ? (
                          <img
                            src={recruiter.profile_image_url}
                            alt={recruiter.recruiter_name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-[#0A6A47] flex items-center justify-center text-white font-bold text-lg">
                            {getInitials(recruiter.recruiter_name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {recruiter.recruiter_name}
                          </h3>
                          {recruiter.designation && (
                            <p className="text-sm text-gray-600 truncate">
                              {recruiter.designation}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Company */}
                      {recruiter.company && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Building2 className="h-4 w-4" />
                          <span className="truncate">{recruiter.company}</span>
                        </div>
                      )}

                      {/* Followers */}
                      {recruiter.followers_count && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                          <Users className="h-4 w-4" />
                          <span>{recruiter.followers_count.toLocaleString()} followers</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                        {recruiter.linkedin_url && (
                          <a
                            href={recruiter.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                          >
                            <Linkedin className="h-4 w-4" />
                            View Profile
                          </a>
                        )}
                        <button
                          onClick={() => router.push(`/careers/outreach/new?recruiter=${recruiter.id}`)}
                          className="flex-1 flex items-center justify-center gap-2 bg-[#0A6A47] text-white px-4 py-2 rounded-lg hover:bg-[#085a3a] transition-colors text-sm font-medium"
                        >
                          <Mail className="h-4 w-4" />
                          Email
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No recruiters found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try different keywords or remove the location filter
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Start your search
            </h3>
            <p className="text-gray-600">
              Enter keywords above to find recruiters on LinkedIn
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
