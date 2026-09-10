import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MCP SHIELD — Runtime Integrity & Threat Protection for AI Agents',
  description: 'Enterprise runtime security layer for Model Context Protocol (MCP) tools. Deterministic SHA-256 fingerprinting, threat interception, prompt injection defense, and SOC observability.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
