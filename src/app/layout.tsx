import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "@/components/ui";
import { SearchProvider } from "@/components/SearchProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "AmityMate.ai | AI Exam Predictor for Amity University",
	description: "AI-powered exam question prediction system using Gemini 3.0",
	icons: {
		icon: "/favicon.ico",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ClerkProvider
			appearance={{
				baseTheme: dark,
				variables: {
					colorPrimary: "#8b5cf6",
					colorBackground: "#0f0f23",
					colorInputBackground: "#1a1a2e",
					colorInputText: "#ffffff",
				},
				elements: {
					formButtonPrimary:
						"bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0",
					card: "bg-gray-900/90 backdrop-blur-xl border border-white/10",
					headerTitle: "text-white",
					headerSubtitle: "text-gray-400",
					socialButtonsBlockButton:
						"bg-white/5 border-white/10 text-white hover:bg-white/10",
					formFieldLabel: "text-gray-300",
					formFieldInput:
						"bg-white/5 border-white/10 text-white focus:border-violet-500",
					footerActionLink: "text-violet-400 hover:text-violet-300",
					userButtonPopoverCard: "bg-gray-900 border border-white/10",
					userButtonPopoverActionButton:
						"text-gray-300 hover:text-white hover:bg-white/5",
				},
			}}
		>
			<html lang="en" suppressHydrationWarning>
				<body className={inter.className}>
					<SearchProvider>
						{children}
						<Toaster />
					</SearchProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
