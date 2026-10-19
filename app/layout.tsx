import type { Metadata } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/dist/client/script";
import Navbar from "./components/navbar";
import { siteUrl } from "./lib/site";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Chanel Muir",
  description: "Chanel Muir's site for hosting hobby projects: SleeveMap, running stats, NZ Road Relay splits and more.",
  icons: {
    icon: "/favicon.ico", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    
    <html
      lang="en"
      className={`${archivo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <Script
        src="https://kit.fontawesome.com/cbfd9f18ad.js"
        strategy="afterInteractive"
      />
      <body className="min-h-full flex flex-col bg-background font-sans">
        <Navbar />
        {children}</body>
    </html>
  );
}
