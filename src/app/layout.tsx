import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7B61FF" },
    { media: "(prefers-color-scheme: dark)", color: "#7B61FF" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "MUGHIS BANK — Sistem Operasi Keuangan",
  description: "Sistem operasi keuangan modern untuk manajemen bisnis",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MUGHIS BANK",
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no" />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="HandheldFriendly" content="true" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <link rel="mask-icon" href="/icon-512.svg" color="#7B61FF" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
