import type { Metadata, Viewport } from "next";
import { Toaster } from '@/components/ui/sonner'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  title: "PayCrew - Gestionale Paghe",
  description: "Sistema gestionale per amministrazione del personale e paghe, ottimizzato per il settore ristorazione",
  applicationName: "PayCrew",
  authors: [{ name: "PayCrew Team" }],
  generator: "Next.js",
  keywords: ["gestionale", "paghe", "dipendenti", "presenze", "cedolini", "ristorazione", "HR"],
  referrer: "origin-when-cross-origin",
  creator: "PayCrew",
  publisher: "PayCrew",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "PayCrew",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "https://pay-crew.vercel.app",
    siteName: "PayCrew",
    title: "PayCrew - Gestionale Paghe",
    description: "Sistema gestionale per amministrazione del personale e paghe",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "PayCrew Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "PayCrew - Gestionale Paghe",
    description: "Sistema gestionale per amministrazione del personale e paghe",
    images: ["/icons/icon-512x512.png"],
  },
  metadataBase: new URL("https://pay-crew.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="font-sans antialiased">
        {children}
        <Toaster />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
