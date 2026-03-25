import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import Navigation from "~/components/Navigation";
import QueryProvider from "~/components/QueryProvider";
import { env } from "~/env";

export const metadata: Metadata = {
	metadataBase: new URL(env.NEXT_PUBLIC_BASE_URL),
	title: {
		default: "Analyze | Code Intelligence",
		template: "%s | Analyze",
	},
	description:
		"A premium repository analyzer for the modern developer. Visualize architecture, identify hotspots, and master your codebase with editorial precision.",
	keywords: [
		"github analyzer",
		"code analysis",
		"repository insights",
		"dependency graph",
		"code hotspots",
		"static analysis",
	],
	authors: [{ name: "Repository Analyzer Team" }],
	creator: "Repository Analyzer",
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://repo-analyzer.dev",
		siteName: "Repository Analyzer",
		title: "Repository Analyzer - Deep Insights for Your Codebase",
		description:
			"Get deep insights into any GitHub repository. Explore structure, analyze dependencies, find hotspots, and understand your project's architecture.",
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "Repository Analyzer",
			},
		],
	},
	alternates: {
		canonical: "https://repo-analyzer.dev",
		languages: {
			en: "https://repo-analyzer.dev",
		},
	},
	twitter: {
		card: "summary_large_image",
		title: "Repository Analyzer - Deep Insights for Your Codebase",
		description:
			"Get deep insights into any GitHub repository. Explore structure, analyze dependencies, find hotspots.",
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

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

import { ThemeProvider } from "~/components/ThemeProvider";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html className={`${geist.variable}`} lang="en" suppressHydrationWarning>
			<body>
				<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
					<QueryProvider>
						<TooltipProvider>
							<Suspense>
								<Navigation />
							</Suspense>
							<main className="min-h-[calc(100vh-64px)]">{children}</main>
						</TooltipProvider>
						<Toaster />
					</QueryProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
