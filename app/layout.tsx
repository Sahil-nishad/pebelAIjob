import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "@/components/session-provider";
import "./globals.css";

const BASE_URL = "https://pebelai.com"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "PebelAI – AI Job Tracker & Interview Coach",
    template: "%s | PebelAI",
  },
  description:
    "PebelAI is a free AI-powered job tracker and interview coach. Track every application, practice interviews with AI, get follow-up reminders, and land your dream job faster.",
  keywords: [
    "job tracker", "job application tracker", "AI interview coach",
    "interview practice", "job search tool", "AI interview practice",
    "follow-up reminders", "career management", "job hunting app",
    "AI career coach", "application tracker free",
  ],
  authors: [{ name: "PebelAI", url: BASE_URL }],
  creator: "PebelAI",
  publisher: "PebelAI",
  category: "Productivity",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "PebelAI",
    title: "PebelAI – AI Job Tracker & Interview Coach",
    description:
      "Track every job application, practice interviews with AI, and never miss a follow-up. The smartest way to manage your job search.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PebelAI – AI-Powered Job Tracker",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "PebelAI – AI Job Tracker & Interview Coach",
    description:
      "Track applications, practice interviews with AI, and land your dream job faster.",
    images: ["/og-image.png"],
    creator: "@pebelai",
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
    apple: "/icon.svg",
  },

  verification: {
    google: "76627f6cd45198c1",
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PebelAI',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: BASE_URL,
  description:
    'Free AI-powered job tracker and interview coach. Track every application, practice interviews with AI, get follow-up reminders, and land your dream job faster.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '120',
  },
  featureList: [
    'Job application tracking',
    'AI interview practice',
    'Follow-up reminders',
    'Career insights & analytics',
    'Career dashboard',
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
