import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import Providers from "./providers";
import '../lib/startup';
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgendaJD - Loja Jacques de Molay",
  description: "Flanelógrafo digital e sistema de agenda para a Loja Jacques de Molay",
  manifest: "/manifest.json",
  themeColor: "#0F2B5B",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AgendaJD"
  },
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32" },
      { url: "/icons/icon-192x192.png", sizes: "192x192" }
    ],
    apple: [
      { url: "/icons/icon-192x192.png" }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/icons/icon-32x32.png" sizes="32x32" />
        <link rel="icon" href="/icons/icon-192x192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AgendaJD" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0F2B5B" />
        <meta name="application-name" content="AgendaJD" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster position="top-right" />
          <Script src="/pwa.js" strategy="afterInteractive" />
        </Providers>
      </body>
    </html>
  );
}
