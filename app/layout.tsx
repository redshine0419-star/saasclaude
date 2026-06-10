import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";
import { DarkModeProvider } from "@/components/DarkModeProvider";
import AuthProvider from "@/components/AuthProvider";
import { AppLangProvider } from "@/components/AppLangContext";
import ChatWidget from "@/components/ChatWidget";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GrowWeb.me",
  description: "AI Marketing SaaS — GEO & SEO Diagnostics, Multi-channel Content, Performance Dashboard",
  icons: {
    icon: [
      { url: '/icon', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
  },
  other: {
    'naver-site-verification': '5a5f2d5a0e811f2fb0fc3d94d54a6a6a92b18eaa',
    'google-adsense-account': 'ca-pub-5240608264303390',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const lang = headersList.get('x-lang') ?? 'ko';

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="alternate" hrefLang="ko" href="https://growweb.me/" />
        <link rel="alternate" hrefLang="en" href="https://en.growweb.me/" />
        <link rel="alternate" hrefLang="ja" href="https://ja.growweb.me/" />
        <link rel="alternate" hrefLang="x-default" href="https://growweb.me/" />
      </head>
      <body className="min-h-full flex flex-col">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LNFYKK06L6"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LNFYKK06L6');
          `}
        </Script>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5240608264303390"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <AuthProvider>
          <DarkModeProvider>
            <AppLangProvider>
              {children}
              <ChatWidget />
            </AppLangProvider>
          </DarkModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
