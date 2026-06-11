"use client";
import "./globals.css";
import 'quill/dist/quill.snow.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="h-screen w-screen overflow-hidden bg-[#0b0f1a]">
        {/* Kontrol tamamen page.tsx'e devredildi [cite: 2026-01-28] */}
        {children}
      </body>
    </html>
  );
}