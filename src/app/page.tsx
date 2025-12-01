"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
	const [stats, setStats] = useState({
		subjects: 0,
		questions: 0,
		predictions: 0,
		accuracy: 0,
	});

	useEffect(() => {
		// Fetch stats from API
		fetch("/api/stats")
			.then((res) => res.json())
			.then((data) => setStats(data))
			.catch(() => {});
	}, []);

	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-8">
			{/* Hero Section */}
			<div className="text-center mb-12 animate-fadeIn">
				<div className="flex items-center justify-center gap-3 mb-4">
					<span className="text-5xl">🎯</span>
					<h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
						AI Exam Predictor
					</h1>
				</div>
				<p className="text-xl text-gray-300 mt-4 max-w-2xl">
					Powered by{" "}
					<span className="text-purple-400 font-semibold">Gemini 3.0</span> to
					predict exam questions with advanced pattern recognition
				</p>
				<p className="text-lg text-purple-300 mt-2">
					🏛️ Amity University Patna
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 w-full max-w-4xl">
				<StatCard icon="📚" value={stats.subjects} label="Subjects" />
				<StatCard icon="❓" value={stats.questions} label="Questions" />
				<StatCard icon="🎯" value={stats.predictions} label="Predictions" />
				<StatCard icon="✅" value={`${stats.accuracy}%`} label="Accuracy" />
			</div>

			{/* Action Buttons */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
				<ActionCard
					href="/dashboard"
					icon="📊"
					title="Dashboard"
					description="View predictions and analytics"
					color="from-purple-600 to-purple-800"
				/>
				<ActionCard
					href="/upload"
					icon="📤"
					title="Upload Data"
					description="Add exam papers & syllabi"
					color="from-pink-600 to-pink-800"
				/>
				<ActionCard
					href="/predict"
					icon="🔮"
					title="Predict"
					description="Generate exam predictions"
					color="from-indigo-600 to-indigo-800"
				/>
			</div>

			{/* Features Section */}
			<div className="mt-16 w-full max-w-4xl">
				<h2 className="text-2xl font-bold text-center mb-8 text-gray-200">
					How It Works
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<FeatureCard
						step="1"
						icon="📄"
						title="Upload PDFs"
						description="Upload past exam papers, syllabi, and lecture notes"
					/>
					<FeatureCard
						step="2"
						icon="🧠"
						title="AI Analysis"
						description="Gemini 3.0 extracts patterns and identifies trends"
					/>
					<FeatureCard
						step="3"
						icon="🎯"
						title="Get Predictions"
						description="Receive probabilistic question predictions"
					/>
				</div>
			</div>

			{/* Footer */}
			<footer className="mt-16 text-center text-gray-500 text-sm">
				<p>Built with Next.js, Prisma, and Gemini 3.0</p>
				<p className="mt-1">© 2025 AI Exam Predictor</p>
			</footer>
		</main>
	);
}

function StatCard({
	icon,
	value,
	label,
}: {
	icon: string;
	value: number | string;
	label: string;
}) {
	return (
		<div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center border border-white/10">
			<span className="text-2xl">{icon}</span>
			<p className="text-3xl font-bold text-white mt-2">{value}</p>
			<p className="text-sm text-gray-400">{label}</p>
		</div>
	);
}

function ActionCard({
	href,
	icon,
	title,
	description,
	color,
}: {
	href: string;
	icon: string;
	title: string;
	description: string;
	color: string;
}) {
	return (
		<Link href={href}>
			<div
				className={`bg-gradient-to-br ${color} rounded-xl p-6 cursor-pointer 
        hover:scale-105 transition-transform duration-200 pulse-glow h-full`}
			>
				<span className="text-4xl">{icon}</span>
				<h3 className="text-xl font-bold text-white mt-3">{title}</h3>
				<p className="text-sm text-gray-200 mt-1">{description}</p>
			</div>
		</Link>
	);
}

function FeatureCard({
	step,
	icon,
	title,
	description,
}: {
	step: string;
	icon: string;
	title: string;
	description: string;
}) {
	return (
		<div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center">
			<div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
				<span className="text-sm font-bold">{step}</span>
			</div>
			<span className="text-3xl">{icon}</span>
			<h3 className="text-lg font-semibold text-white mt-3">{title}</h3>
			<p className="text-sm text-gray-400 mt-2">{description}</p>
		</div>
	);
}
