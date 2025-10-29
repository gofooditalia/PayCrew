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
        <footer className="fixed bottom-4 right-4 text-xs text-gray-500 flex items-center gap-1">
          Powered by:
          <a
            href="mailto:italiagofood@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
          >
            <img
              src="/gofood.svg"
              alt="GO!Food Italia"
              className="h-4 w-auto"
            />
            GO!Food Italia
          </a>
        </footer>
      </body>
    </html>
  );
}
