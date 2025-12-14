import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar"; // Import Navbar

export const metadata: Metadata = {
  title: "NPKSense - Smart Fertilizer",
  description: "AI-Powered Fertilizer Analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50">
        <Navbar /> {/* ใส่ Navbar ตรงนี้ */}
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}