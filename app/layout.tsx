import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "@/components/session-provider";
import "./globals.css";

const BASE_URL = "https://www.pebelai.com"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "PebelAI — AI Interview Coach, Job Search & Application Tracker for India",
    template: "%s | PebelAI",
  },
  description:
    "Practice mock interviews with AI voice coach, find jobs matched to your resume from Naukri & LinkedIn, and track every application in one place. Built for Indian job seekers.",
  keywords: [
    "ai interview coach india", "mock interview ai", "job search india",
    "naukri job search", "resume job matching", "job application tracker",
    "interview practice ai", "ai career platform india", "job portal india",
    "interview preparation india", "voice interview practice", "job tracker free",
    "career platform india", "pebelai", "ai job search",
  ],
  authors: [{ name: "Sahil Nishad", url: `${BASE_URL}/about` }],
  creator: "PebelAI",
  publisher: "PebelAI",
  category: "Productivity",

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "PebelAI",
    title: "PebelAI — AI Interview Coach, Job Search & Application Tracker",
    description:
      "Practice interviews with AI, find jobs matched to your resume, and track every application. Free for Indian job seekers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PebelAI — AI Interview Coach & Job Search Platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "PebelAI — AI Interview Coach & Job Search for India",
    description:
      "Practice mock interviews with AI, find matching jobs from Naukri & LinkedIn, track applications. Free forever.",
    images: ["/og-image.png"],
    creator: "@pebelai",
    site: "@pebelai",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
  },

  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },

  verification: {
    google: "76627f6cd45198c1",
  },

  other: {
    "format-detection": "telephone=no",
  },
};

const jsonLdGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#org`,
      name: 'PebelAI',
      alternateName: 'Pebel AI',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/pebelai-logo.svg`,
        width: 256,
        height: 256,
      },
      description:
        'AI-powered career platform for Indian job seekers. Practice mock interviews with voice AI, find jobs matched to your resume from Naukri & LinkedIn, and track every application in one place.',
      foundingDate: '2026',
      founder: {
        '@type': 'Person',
        name: 'Sahil Nishad',
        url: `${BASE_URL}/about`,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@pebelai.com',
        availableLanguage: ['English', 'Hindi'],
      },
      sameAs: [
        'https://twitter.com/pebelai',
        'https://www.linkedin.com/company/pebelai',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'PebelAI',
      description: 'AI interview coach, job search portal, and application tracker for India.',
      publisher: { '@id': `${BASE_URL}/#org` },
      inLanguage: 'en-IN',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/blog?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${BASE_URL}/#software`,
      name: 'PebelAI',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'AI Interview Coach & Job Search',
      operatingSystem: 'Web, Android, iOS',
      url: BASE_URL,
      description:
        'Practice mock interviews with AI voice coach, find jobs matched to your resume from Naukri & LinkedIn, and track every application. Built for Indian job seekers.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '120',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'AI voice interview coach with performance report',
        'Live interview simulation (Google Meet style)',
        'Job search matched to resume from Naukri, LinkedIn, Indeed',
        'Application tracking dashboard',
        'Smart follow-up reminders',
        'Resume upload and AI parsing',
        'Interview practice streak tracker',
      ],
      author: { '@id': `${BASE_URL}/#org` },
      publisher: { '@id': `${BASE_URL}/#org` },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "12px",
              background: "#FFFFFF",
              color: "#13211B",
              border: "1px solid rgba(19,33,27,0.08)",
              boxShadow: "0 18px 44px rgba(15,23,42,0.08)",
            },
          }}
        />
      </body>
    </html>
  );
}
