import type { Metadata } from "next";
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
      </body>
    </html>
  );
}
