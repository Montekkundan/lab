import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { defaultMeta, siteOrigin } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: defaultMeta.title,
    template: "%s | lab.montek.dev",
  },
  description: defaultMeta.description,
  metadataBase: new URL(siteOrigin),
  authors: [{ name: "Montek Kundan", url: "https://montek.dev" }],
  creator: "Montek Kundan",
  publisher: "Montek Kundan",
  keywords: ["experiments", "creative coding", "web development", "three.js", "animations", "montek", "lab"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteOrigin,
    title: defaultMeta.title,
    description: defaultMeta.description,
    siteName: "Montek's Lab",
    images: [
      {
        url: defaultMeta.ogImage,
        width: 1200,
        height: 630,
        alt: "Montek's Lab - Experimental corner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultMeta.title,
    description: defaultMeta.description,
    images: [defaultMeta.ogImage],
    creator: defaultMeta.twitter.handle,
    site: defaultMeta.twitter.site,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/favicon.svg",
      },
    ],
  },
  manifest: "/manifest.webmanifest",
  applicationName: "Montek's Lab",
  formatDetection: {
    telephone: false,
  },
  category: "technology",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: defaultMeta.title,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
      </body>
    </html>
  );
}
