import type { Metadata } from "next";
import { Toaster } from '@/components/ui/sonner'
import "./globals.css";

export const metadata: Metadata = {
  title: "PayCrew - Gestionale Paghe",
  description: "Sistema gestionale per amministrazione del personale",
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
      </body>
    </html>
  );
}
