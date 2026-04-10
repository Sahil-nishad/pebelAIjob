'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, Lock, CheckCircle2, LayoutDashboard, Search, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const features = [
  { icon: LayoutDashboard, text: 'Visual Kanban board to track every application' },
  { icon: Search, text: 'AI-powered job matching and recommendations' },
  { icon: BarChart3, text: 'Analytics and insights on your job search' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim())
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      router.push('/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed'
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim())
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[40%] flex-col justify-between bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-40 right-0 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-12">
            <Image src="/pebelai-logo.svg" alt="PebelAI" width={420} height={120} className="h-8 w-auto brightness-0 invert" />
          </div>

          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] leading-tight mb-4">
            Land your dream job,{' '}
            <span className="text-emerald-100">organized.</span>
          </h1>
          <p className="text-emerald-100 text-base mb-10 max-w-sm">
            The AI-powered job tracker that turns your search into a streamlined workflow.
          </p>

          <ul className="space-y-4">
            {features.map((feature) => (
              <li key={feature.text} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5 text-emerald-200 shrink-0" />
                <span className="text-sm text-emerald-50">{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 mt-auto pt-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex gap-3">
              {['Applied', 'Interview', 'Offer'].map((col) => (
                <div key={col} className="flex-1">
                  <div className="text-xs font-medium text-emerald-200 mb-2">{col}</div>
                  <div className="space-y-2">
                    <div className="bg-white/15 rounded-lg h-8" />
                    <div className="bg-white/10 rounded-lg h-8" />
                    {col === 'Applied' && <div className="bg-white/10 rounded-lg h-8" />}
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
            <Image src="/pebelai-logo.svg" alt="PebelAI" width={420} height={120} className="h-8 w-auto" />
          </div>

          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-slate-900 mb-1">
            Welcome back
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Sign in to continue tracking your applications.
          </p>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Mail className="absolute right-3 top-[38px] w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div>
              <div className="relative">
                <Input
                  id="password"
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <Lock className="absolute right-3 top-[38px] w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="mt-1.5 text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Sign In
            </Button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Button
            variant="outline"
            size="lg"
            loading={googleLoading}
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          <p className="text-center text-sm text-slate-500 mt-8">
            No account?{' '}
            <Link
              href="/signup"
              className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
            >
              Sign up free &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
