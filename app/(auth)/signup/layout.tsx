import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account — Pebel AI',
  description: 'Create your free Pebel AI account to track job applications, get AI interview coaching, and land your dream role.',
  alternates: { canonical: 'https://www.pebelai.com/signup' },
  openGraph: {
    title: 'Create Account — Pebel AI',
    description: 'Start your job search smarter. Free forever.',
    url: 'https://www.pebelai.com/signup',
  },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
