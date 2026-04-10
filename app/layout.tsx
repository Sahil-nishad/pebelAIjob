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
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "12px",
              background: "#fff",
              color: "#0F172A",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            },
          }}
        />
      </body>
    </html>
  );
}
