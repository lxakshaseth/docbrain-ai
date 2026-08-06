import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ReactQueryProvider } from "../components/providers/ReactQueryProvider";
import "./globals.css";

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "DocBrain AI • Intelligent PDF Knowledge Assistant",
  description: "Production-ready AI Assistant for PDF Knowledge Base RAG Ingestion & Q&A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sansFont.variable} suppressHydrationWarning>
      <body className="antialiased min-h-screen font-sans bg-slate-900 text-slate-100" suppressHydrationWarning>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}

