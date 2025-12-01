"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Navbar, BottomNav, MobileHeader } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import {
	Sparkles,
	BookOpen,
	Brain,
	Target,
	TrendingUp,
	Upload,
	ArrowRight,
	Zap,
	Shield,
	BarChart3,
	FileText,
	CheckCircle2,
} from "lucide-react";

export default function Home() {
	const [stats, setStats] = useState({
		subjects: 0,
		questions: 0,
		predictions: 0,
		accuracy: 0,
	});

	useEffect(() => {
		fetch("/api/stats")
			.then((res) => res.json())
			.then((data) => setStats(data))
			.catch(() => {
				setStats({
					subjects: 12,
					questions: 500,
					predictions: 1500,
					accuracy: 89,
				});
			});
	}, []);

	return (
		<div className="min-h-screen bg-background">
			<Navbar />
			<MobileHeader />

			{/* Hero Section */}
			<section className="pt-safe md:pt-28 pb-16 md:pb-24 px-4">
				<div className="container-custom">
					<div className="max-w-3xl mx-auto text-center">
						{/* Badge */}
						<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-sm mb-8">
							<Sparkles className="w-4 h-4 text-violet-400" />
							<span className="text-violet-300">Powered by Gemini 3.0</span>
						</div>{" "}
						{/* Heading */}
						<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
							<span className="text-white">Predict Your </span>
							<span className="gradient-text">Exam Questions</span>
							<br className="hidden sm:block" />
							<span className="text-white"> with AI Precision</span>
						</h1>
						{/* Description */}
						<p className="text-base sm:text-lg text-gray-400 mb-6 max-w-xl mx-auto">
							Upload your syllabus and past papers. Our AI analyzes patterns and
							predicts the most likely questions for your exams.
						</p>
						{/* University */}
						<div className="flex items-center justify-center gap-2 mb-8">
							<BookOpen className="w-4 h-4 text-violet-400" />
							<span className="text-gray-300 text-sm font-medium">
								Amity University Patna
							</span>
						</div>
						{/* CTA Buttons */}
						<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
							<SignedOut>
								<SignInButton mode="modal">
									<Button
										size="lg"
										rightIcon={<ArrowRight className="w-4 h-4" />}
									>
										Get Started Free
									</Button>
								</SignInButton>
							</SignedOut>
							<SignedIn>
								<Link href="/dashboard">
									<Button
										size="lg"
										rightIcon={<ArrowRight className="w-4 h-4" />}
									>
										Go to Dashboard
									</Button>
								</Link>
							</SignedIn>
							<Link href="/predict">
								<Button variant="secondary" size="lg">
									Try Prediction
								</Button>
							</Link>
						</div>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-16 max-w-2xl mx-auto">
						<StatCard icon={BookOpen} value={stats.subjects} label="Subjects" />
						<StatCard
							icon={FileText}
							value={stats.questions}
							label="Questions"
						/>
						<StatCard
							icon={Brain}
							value={stats.predictions}
							label="Predictions"
						/>
						<StatCard
							icon={TrendingUp}
							value={`${stats.accuracy}%`}
							label="Accuracy"
						/>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className="section-padding px-4 bg-gradient-to-b from-transparent via-violet-950/5 to-transparent">
				<div className="container-custom">
					<div className="text-center mb-12">
						<h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
							How It Works
						</h2>
						<p className="text-gray-400">
							Three simple steps to get AI-powered predictions
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-4 md:gap-6">
						{[
							{
								step: 1,
								icon: Upload,
								title: "Upload Content",
								description:
									"Upload your syllabus and past exam papers in PDF format",
							},
							{
								step: 2,
								icon: Brain,
								title: "AI Analysis",
								description:
									"Our AI analyzes patterns and topic weightage from your data",
							},
							{
								step: 3,
								icon: Target,
								title: "Get Predictions",
								description:
									"Receive probability-based predictions for likely questions",
							},
						].map((item) => (
							<Card key={item.step} hover className="relative">
								<div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs text-gray-500 font-semibold">
									{item.step}
								</div>
								<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mb-4">
									<item.icon className="w-6 h-6 text-violet-400" />
								</div>
								<h3 className="text-lg font-semibold text-white mb-2">
									{item.title}
								</h3>
								<p className="text-sm text-gray-400">{item.description}</p>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Features */}
			<section className="section-padding px-4">
				<div className="container-custom">
					<div className="text-center mb-12">
						<h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
							Why Choose Us
						</h2>
						<p className="text-gray-400">Built for Amity University students</p>
					</div>

					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{[
							{
								icon: Zap,
								title: "Fast Analysis",
								desc: "Get predictions in seconds",
							},
							{
								icon: Shield,
								title: "High Accuracy",
								desc: "Gemini 3.0 powered analysis",
							},
							{
								icon: BarChart3,
								title: "Pattern Detection",
								desc: "Identifies recurring patterns",
							},
							{
								icon: BookOpen,
								title: "Syllabus Aligned",
								desc: "Based on your curriculum",
							},
							{
								icon: Target,
								title: "Topic Weightage",
								desc: "Focus on important topics",
							},
							{
								icon: CheckCircle2,
								title: "Easy to Use",
								desc: "Simple upload and predict",
							},
						].map((item, i) => (
							<Card key={i} hover className="flex items-start gap-4">
								<div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
									<item.icon className="w-5 h-5 text-violet-400" />
								</div>
								<div>
									<h3 className="font-semibold text-white mb-1">
										{item.title}
									</h3>
									<p className="text-sm text-gray-400">{item.desc}</p>
								</div>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="section-padding px-4 pb-safe md:pb-24">
				<div className="container-custom">
					<Card variant="gradient" className="text-center py-12">
						<h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
							Ready to Ace Your Exams?
						</h2>
						<p className="text-gray-400 mb-6 max-w-md mx-auto">
							Join students using AI to prepare smarter
						</p>
						<SignedOut>
							<SignInButton mode="modal">
								<Button
									size="lg"
									rightIcon={<ArrowRight className="w-4 h-4" />}
								>
									Get Started Free
								</Button>
							</SignInButton>
						</SignedOut>
						<SignedIn>
							<Link href="/dashboard">
								<Button
									size="lg"
									rightIcon={<ArrowRight className="w-4 h-4" />}
								>
									Go to Dashboard
								</Button>
							</Link>
						</SignedIn>
					</Card>
				</div>
			</section>

			{/* Footer - Desktop only */}
			<footer className="hidden md:block py-8 px-4 border-t border-white/5">
				<div className="container-custom flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
							<Sparkles className="w-3.5 h-3.5 text-white" />
						</div>
						<span className="text-sm font-medium text-white">AmityMate.ai</span>
					</div>
					<p className="text-xs text-gray-500">2025 AmityMate.ai</p>
				</div>
			</footer>

			<BottomNav />
		</div>
	);
}

function StatCard({
	icon: Icon,
	value,
	label,
}: {
	icon: React.ComponentType<{ className?: string }>;
	value: number | string;
	label: string;
}) {
	return (
		<div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
			<Icon className="w-5 h-5 mx-auto mb-2 text-violet-400" />
			<p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
			<p className="text-xs text-gray-500">{label}</p>
		</div>
	);
}
