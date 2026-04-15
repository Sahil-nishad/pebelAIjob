'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, Lock, User, CheckCircle2, LayoutDashboard, MessageSquare, Bell, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signIn } from 'next-auth/react'

const features = [
  { icon: LayoutDashboard, text: 'Track all your applications' },
  { icon: MessageSquare, text: 'AI interview prep coach' },
  { icon: Bell, text: 'Smart follow-up reminders' },
  { icon: BarChart3, text: 'Career insights & analytics' },
]

const jobTypes = ['Full-time', 'Part-time', 'Internship', 'Freelance', 'Any']
const experienceLevels = ['Entry', 'Mid', 'Senior', 'Executive']

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [jobType, setJobType] = useState('Full-time')
  const [experience, setExperience] = useState('Mid')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    const errorCode = searchParams.get('error')
    if (errorCode) setError('Google sign-in failed. Please try again.')
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, job_type: jobType, experience_level: experience }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Signup failed.')
      setLoading(false)
      return
    }

    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('Account created but sign-in failed. Please log in.')
      router.push('/login')
    } else {
      router.push('/dashboard')
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    setGoogleLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[40%] flex-col justify-between bg-gradient-to-br from-[#EEF8F1] via-[#E6F4EC] to-[#D8EDE0] p-10 text-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 w-64 h-64 rounded-full bg-emerald-200/35 blur-3xl" />
          <div className="absolute bottom-40 right-0 w-80 h-80 rounded-full bg-sky-200/25 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-12">
            <Image src="/pebelai-logo.svg" alt="PebelAI" width={420} height={120} className="h-10 w-auto max-w-[180px]" />
          </div>

          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] leading-tight mb-4">
            Land your dream job. <span className="text-emerald-700">Faster.</span>
          </h1>
          <p className="text-slate-600 text-base mb-10 max-w-sm">
            Join thousands of job seekers who track smarter and land offers faster.
          </p>

          <ul className="space-y-4">
            {features.map((f) => (
              <li key={f.text} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5 text-emerald-600 shrink-0" />
                <span className="text-sm text-slate-700">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 mt-auto pt-10">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex gap-3">
              {['Applied', 'Interview', 'Offer'].map((col) => (
                <div key={col} className="flex-1">
                  <div className="text-xs font-medium text-emerald-700 mb-2">{col}</div>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg h-8 border border-slate-200" />
                    <div className="bg-slate-50 rounded-lg h-8 border border-slate-200" />
                    {col === 'Applied' && <div className="bg-slate-50 rounded-lg h-8 border border-slate-200" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <Image src="/pebelai-logo.svg" alt="PebelAI" width={420} height={120} className="h-10 w-auto max-w-[180px]" />
          </div>

          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-slate-900 mb-1">Start your job hunt</h2>
          <p className="text-slate-500 text-sm mb-8">Create your free account to get started.</p>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input id="name" label="Full Name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
              <User className="absolute right-3 top-[38px] w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <Input id="email" label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              <Mail className="absolute right-3 top-[38px] w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <Input id="password" label="Password" type="password" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
              <Lock className="absolute right-3 top-[38px] w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Currently looking for</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors cursor-pointer"
              >
                {jobTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Experience level</label>
              <div className="flex gap-2">
                {experienceLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setExperience(level)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      experience === level
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Create Free Account
            </Button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Button variant="outline" size="lg" loading={googleLoading} className="w-full" onClick={handleGoogleSignIn}>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          <p className="text-center text-sm text-slate-500 mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors">Sign in &rarr;</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
