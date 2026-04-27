import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — Pebel AI',
  description: 'Sign in to your Pebel AI workspace to track applications, practice interviews, and land your next job.',
  alternates: { canonical: 'https://www.pebelai.com/login' },
  openGraph: {
    title: 'Sign In — Pebel AI',
    description: 'Sign in to your Pebel AI workspace.',
    url: 'https://www.pebelai.com/login',
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
