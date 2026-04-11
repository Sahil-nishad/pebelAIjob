import type { Metadata } from "next";
import { Sora, Nunito_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-sora",
});

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "PebelAI - Land Your Dream Job. Faster.",
  description:
    "Track every application, nail every interview, never miss a follow-up. AI-powered job hunting made simple.",
  keywords: ["job tracker", "interview coach", "AI", "resume analyzer", "job search"],
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${nunito.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {children}
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
