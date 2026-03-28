import "~/styles/globals.css";

import type { Metadata } from "next";
import { DM_Serif_Display, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import Navigation from "~/components/Navigation";
import QueryProvider from "~/components/QueryProvider";
import { env } from "~/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_BASE_URL),
  title: {
    default: "Analyze — Code Intelligence",
    template: "%s — Analyze",
  },
  description:
    "A precise repository analyzer for the modern developer. Visualize architecture, identify hotspots, and understand your codebase with editorial clarity.",
  keywords: [
    "github analyzer",
    "code analysis",
    "repository insights",
    "dependency graph",
    "code hotspots",
    "static analysis",
  ],
  authors: [{ name: "Analyze" }],
  creator: "Analyze",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: env.NEXT_PUBLIC_BASE_URL,
    siteName: "Analyze",
    title: "Analyze — Code Intelligence",
    description:
      "Deep insights into any GitHub repository. Explore structure, analyze dependencies, find hotspots.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Analyze — Code Intelligence",
      },
    ],
  },
  alternates: {
    canonical: env.NEXT_PUBLIC_BASE_URL,
    languages: {
      en: env.NEXT_PUBLIC_BASE_URL,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "Analyze — Code Intelligence",
    description:
      "Deep insights into any GitHub repository. Explore structure, analyze dependencies, find hotspots.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  verification: {
    google: "google-site-verification-code",
  },
  manifest: "/manifest.json",
};

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-plex-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

import Breadcrumbs from "~/components/Breadcrumbs";
import Footer from "~/components/Footer";
import { ThemeProvider } from "~/components/ThemeProvider";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      {/* eslint-disable-next-line react/no-danger */}
      <Script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Analyze",
            description:
              "A precise repository analyzer for the modern developer. Visualize architecture, identify hotspots, and understand your codebase with editorial clarity.",
            url: env.NEXT_PUBLIC_BASE_URL,
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          }),
        }}
        id="jsonld"
        strategy="afterInteractive"
        type="application/ld+json"
      />
      <body className="flex min-h-screen flex-col font-sans antialiased" suppressHydrationWarning>
        <Suspense>
          <ThemeProvider>
            <QueryProvider>
              <TooltipProvider>
                <Suspense>
                  <Navigation />
                </Suspense>
                <Suspense>
                  <Breadcrumbs />
                </Suspense>
                <main className="flex-1 pt-14.25">{children}</main>
                <Footer />
              </TooltipProvider>
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}
