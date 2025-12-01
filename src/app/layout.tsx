import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "AI Exam Predictor | Amity University Patna",
	description: "AI-powered exam question prediction system using Gemini 3.0",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
					{children}
				</div>
			</body>
		</html>
	);
}
