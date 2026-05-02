import type { Metadata } from 'next'
import Link from 'next/link'
import { ExtensionPageClient } from './page-client'

const BASE_URL = 'https://www.pebelai.com'

export const metadata: Metadata = {
  title: 'Free Chrome Extension — Save LinkedIn & Naukri Jobs to PebelAI',
  description:
    'One-click save jobs from LinkedIn, Naukri, Indeed, Internshala, and any career site. Free Chrome extension — installs in 60 seconds. Works on Chrome, Brave, Edge.',
  alternates: { canonical: `${BASE_URL}/extension` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/extension`,
    title: 'Free Chrome Extension — Save LinkedIn & Naukri Jobs to PebelAI',
    description:
      'One-click save jobs from LinkedIn, Naukri, Indeed, Internshala, and any career site. Free Chrome extension.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PebelAI Chrome Extension — Save Jobs in One Click',
    description: 'Free Chrome extension for Indian job seekers. Works on LinkedIn, Naukri, Indeed, and more.',
  },
}

const installSteps = [
  { name: 'Download the extension ZIP', text: 'Click the Download button. A ZIP file called pebelai-extension.zip is saved to your computer.' },
  { name: 'Unzip the file', text: 'Right-click the ZIP and choose "Extract All" (Windows) or double-click (Mac). Keep the folder somewhere permanent.' },
  { name: 'Open Chrome Extensions page', text: 'Type chrome://extensions in the address bar and press Enter. For Brave use brave://extensions, for Edge use edge://extensions.' },
  { name: 'Enable Developer Mode', text: 'Toggle Developer mode ON in the top-right corner of the Extensions page.' },
  { name: 'Load the extension', text: 'Click "Load unpacked" and select the extracted extension folder.' },
  { name: 'Sign in to PebelAI', text: 'Click the PebelAI icon in your browser toolbar and sign in with your PebelAI account.' },
  { name: 'Browse jobs and save them', text: 'Visit LinkedIn, Naukri, Indeed, or any company careers page — click the PebelAI icon to save the role to your tracker.' },
]

const faqs = [
  { q: 'Is the PebelAI Chrome extension free?', a: 'Yes — the extension is completely free, no credit card required. It works in all Chromium browsers (Chrome, Brave, Edge, Arc).' },
  { q: 'Why isn\'t this on the Chrome Web Store?', a: 'PebelAI is in early access and we update the extension frequently. A Chrome Web Store listing is planned once the product is stable.' },
  { q: 'Does the extension track my browsing?', a: 'No. The extension only activates on job listing pages and only when you click its icon. It does not monitor general browsing.' },
  { q: 'Which job sites does the extension support?', a: 'LinkedIn, Naukri, Indeed, Internshala, Wellfound (AngelList), Glassdoor, Greenhouse, Lever, Workday, and any company career page.' },
  { q: 'What does the ON / OFF badge mean?', a: 'Green ON means you\'re logged in and the extension can save jobs. Grey OFF means you need to sign in via the popup.' },
  { q: 'Will it work on Brave or Edge?', a: 'Yes — any Chromium-based browser (Chrome, Brave, Edge, Arc) supports unpacked extensions via Developer mode.' },
]

export default function ExtensionPublicPage() {
  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to install the PebelAI Chrome Extension',
    description: 'Install the PebelAI Chrome extension to save jobs from LinkedIn, Naukri, Indeed, and any career site in one click.',
    totalTime: 'PT3M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'INR', value: '0' },
    tool: [{ '@type': 'HowToTool', name: 'Chromium browser (Chrome, Brave, Edge, or Arc)' }],
    step: installSteps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PebelAI Chrome Extension',
    applicationCategory: 'BrowserExtension',
    operatingSystem: 'Chrome, Brave, Edge, Arc',
    description: 'Free Chrome extension to save jobs from LinkedIn, Naukri, Indeed, Internshala, and any career site to your PebelAI job tracker.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '85' },
    publisher: { '@id': `${BASE_URL}/#org` },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Chrome Extension', item: `${BASE_URL}/extension` },
    ],
  }

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <header className="border-b border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-[18px] font-bold text-slate-900">PebelAI</Link>
          <nav className="flex items-center gap-6 text-[13px] text-slate-600 font-medium">
            <Link href="/blog" className="hover:text-[#0A6A47]">Blog</Link>
            <Link href="/login" className="hover:text-[#0A6A47]">Log in</Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-lg bg-[#0A6A47] text-white hover:bg-[#085c3d] transition-colors"
            >
              Try free
            </Link>
          </nav>
        </div>
      </header>

      <ExtensionPageClient faqs={faqs} installSteps={installSteps} />
    </main>
  )
}
