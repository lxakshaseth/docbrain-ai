import type { Metadata } from "next";
import { ReactQueryProvider } from "../components/providers/ReactQueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF Knowledge Base AI Chatbot",
  description: "Production-ready AI Full Stack App for PDF RAG Knowledge Bases",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen" suppressHydrationWarning>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
