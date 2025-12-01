"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Navbar, BottomNav, MobileHeader } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { motion } from "framer-motion";
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
	Download,
	Users,
	Clock,
	Star,
	Lightbulb,
	Rocket,
	Award,
} from "lucide-react";

// Animated Stat Card Component
const AnimatedStatCard = ({
	icon: Icon,
	value,
	label,
	delay,
}: {
	icon: any;
	value: string | number;
	label: string;
	delay: number;
}) => {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.5, delay }}
			whileHover={{ scale: 1.05, y: -4 }}
			className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-violet-500/30 transition-all group"
		>
			<Icon className="w-7 h-7 text-violet-400 mb-3 group-hover:text-violet-300 transition-colors" />
			<p className="text-2xl md:text-3xl font-bold text-white mb-1">{value}</p>
			<p className="text-xs text-gray-400">{label}</p>
		</motion.div>
	);
};

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
		<div className="min-h-screen bg-background overflow-hidden">
			<Navbar />
			<MobileHeader />

			{/* Animated Background Elements */}
			<div className="fixed inset-0 -z-10 overflow-hidden">
				<motion.div
					animate={{
						scale: [1, 1.2, 1],
						rotate: [0, 90, 0],
						opacity: [0.3, 0.5, 0.3],
					}}
					transition={{
						duration: 20,
						repeat: Infinity,
						ease: "easeInOut",
					}}
					className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl"
				/>
				<motion.div
					animate={{
						scale: [1, 1.3, 1],
						rotate: [0, -90, 0],
						opacity: [0.2, 0.4, 0.2],
					}}
					transition={{
						duration: 25,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 2,
					}}
					className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
				/>
			</div>

			{/* Hero Section */}
			<section className="relative pt-safe md:pt-32 pb-16 md:pb-24 px-4">
				<div className="container-custom max-w-7xl mx-auto">
					<div className="max-w-4xl mx-auto text-center">
						{/* Badge */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5 }}
							className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 text-sm mb-8 backdrop-blur-sm"
						>
							<motion.div
								animate={{ rotate: [0, 360] }}
								transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
							>
								<Sparkles className="w-4 h-4 text-violet-400" />
							</motion.div>
							<span className="text-violet-300 font-medium">
								Powered by Gemini 3.0
							</span>
						</motion.div>

						{/* Heading */}
						<motion.h1
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.1 }}
							className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight"
						>
							<span className="text-white">Predict Your </span>
							<span className="gradient-text inline-block">
								<motion.span
									initial={{ backgroundPosition: "0% 50%" }}
									animate={{
										backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
									}}
									transition={{ duration: 5, repeat: Infinity }}
									className="bg-gradient-to-r from-violet-400 via-purple-400 to-violet-400 bg-clip-text text-transparent bg-[length:200%_auto]"
								>
									Exam Questions
								</motion.span>
							</span>
							<br />
							<span className="text-white">with AI Precision</span>
						</motion.h1>

						{/* Description */}
						<motion.p
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.2 }}
							className="text-lg sm:text-xl text-gray-400 mb-6 max-w-2xl mx-auto leading-relaxed"
						>
							Upload your syllabus and past papers. Our AI analyzes patterns and
							predicts the most likely questions for your exams with{" "}
							<span className="text-violet-400 font-semibold">
								89% accuracy
							</span>
							.
						</motion.p>

						{/* University Badge */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.3 }}
							className="flex items-center justify-center gap-2 mb-10"
						>
							<BookOpen className="w-5 h-5 text-violet-400" />
							<span className="text-gray-300 text-base font-semibold">
								Amity University Patna
							</span>
							<div className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30">
								<span className="text-green-400 text-xs font-medium">
									Official
								</span>
							</div>
						</motion.div>

						{/* CTA Buttons */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.4 }}
							className="flex flex-col sm:flex-row items-center justify-center gap-4"
						>
							<SignedOut>
								<SignInButton mode="modal">
									<motion.div
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
									>
										<Button
											size="lg"
											className="text-base px-8"
											rightIcon={<ArrowRight className="w-5 h-5" />}
										>
											Get Started Free
										</Button>
									</motion.div>
								</SignInButton>
							</SignedOut>
							<SignedIn>
								<Link href="/dashboard">
									<motion.div
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
									>
										<Button
											size="lg"
											className="text-base px-8"
											rightIcon={<ArrowRight className="w-5 h-5" />}
										>
											Go to Dashboard
										</Button>
									</motion.div>
								</Link>
							</SignedIn>
							<Link href="/notes">
								<motion.div
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									<Button
										variant="secondary"
										size="lg"
										className="text-base px-8"
									>
										Browse Notes
									</Button>
								</motion.div>
							</Link>
						</motion.div>
					</div>

					{/* Animated Stats Grid */}
					<motion.div
						initial={{ opacity: 0, y: 40 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.6 }}
						className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-20 max-w-5xl mx-auto"
					>
						<AnimatedStatCard
							icon={BookOpen}
							value={stats.subjects}
							label="Subjects"
							delay={0.1}
						/>
						<AnimatedStatCard
							icon={FileText}
							value={stats.questions}
							label="Questions"
							delay={0.2}
						/>
						<AnimatedStatCard
							icon={Brain}
							value={stats.predictions}
							label="Predictions"
							delay={0.3}
						/>
						<AnimatedStatCard
							icon={TrendingUp}
							value="89%"
							label="Accuracy"
							delay={0.4}
						/>
					</motion.div>
				</div>
			</section>

			{/* How It Works */}
			<section className="relative py-20 md:py-32 px-4 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent">
				<div className="container-custom max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="text-center mb-16"
					>
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
							How It Works
						</h2>
						<p className="text-lg text-gray-400 max-w-2xl mx-auto">
							Three simple steps to get AI-powered exam predictions
						</p>
					</motion.div>

					<div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
						{/* Connection Lines - Desktop only */}
						<div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

						{[
							{
								step: 1,
								icon: Upload,
								title: "Upload Content",
								description:
									"Upload your syllabus and past exam papers in PDF, DOCX, or image format. Our system accepts multiple file types.",
								color: "from-blue-500 to-cyan-500",
								delay: 0.2,
							},
							{
								step: 2,
								icon: Brain,
								title: "AI Analysis",
								description:
									"Gemini 3.0 analyzes patterns, topic weightage, and historical trends from your uploaded materials.",
								color: "from-violet-500 to-purple-500",
								delay: 0.4,
							},
							{
								step: 3,
								icon: Target,
								title: "Get Predictions",
								description:
									"Receive probability-based predictions with confidence scores for likely exam questions.",
								color: "from-pink-500 to-rose-500",
								delay: 0.6,
							},
						].map((item) => (
							<motion.div
								key={item.step}
								initial={{ opacity: 0, y: 40 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.6, delay: item.delay }}
							>
								<motion.div
									whileHover={{ y: -8, scale: 1.02 }}
									className="relative group"
								>
									<Card className="relative h-full backdrop-blur-xl bg-white/5 border-white/10 hover:border-violet-500/50 transition-all duration-300">
										{/* Step Number Badge */}
										<motion.div
											initial={{ scale: 0 }}
											whileInView={{ scale: 1 }}
											viewport={{ once: true }}
											transition={{ duration: 0.5, delay: item.delay + 0.2 }}
											className="absolute -top-4 -right-4 z-10"
										>
											<div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/50">
												{item.step}
											</div>
										</motion.div>

										{/* Glowing Effect on Hover */}
										<div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/0 to-purple-500/0 group-hover:from-violet-500/10 group-hover:to-purple-500/10 transition-all duration-300" />

										<div className="relative p-8">
											{/* Icon */}
											<motion.div
												whileHover={{ rotate: 360, scale: 1.1 }}
												transition={{ duration: 0.6 }}
												className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg`}
											>
												<item.icon className="w-8 h-8 text-white" />
											</motion.div>

											{/* Content */}
											<h3 className="text-xl font-bold text-white mb-3 group-hover:text-violet-300 transition-colors">
												{item.title}
											</h3>
											<p className="text-gray-400 leading-relaxed">
												{item.description}
											</p>
										</div>
									</Card>
								</motion.div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Features */}
			<section className="py-20 md:py-32 px-4">
				<div className="container-custom max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="text-center mb-16"
					>
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
							Why Choose AmityMate.ai
						</h2>
						<p className="text-lg text-gray-400 max-w-2xl mx-auto">
							Built specifically for Amity University students with cutting-edge
							AI
						</p>
					</motion.div>

					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{[
							{
								icon: Zap,
								title: "Lightning Fast",
								desc: "Get AI-powered predictions in seconds, not hours",
								color: "from-yellow-500 to-orange-500",
								delay: 0.1,
							},
							{
								icon: Shield,
								title: "89% Accuracy",
								desc: "Powered by Google's Gemini 3.0 AI model",
								color: "from-green-500 to-emerald-500",
								delay: 0.2,
							},
							{
								icon: BarChart3,
								title: "Pattern Detection",
								desc: "Identifies recurring question patterns and trends",
								color: "from-blue-500 to-cyan-500",
								delay: 0.3,
							},
							{
								icon: BookOpen,
								title: "Syllabus Aligned",
								desc: "Predictions based on your exact curriculum",
								color: "from-violet-500 to-purple-500",
								delay: 0.4,
							},
							{
								icon: Download,
								title: "Study Notes",
								desc: "Download notes uploaded by students and teachers",
								color: "from-pink-500 to-rose-500",
								delay: 0.5,
							},
							{
								icon: Users,
								title: "Community Driven",
								desc: "Collaborative platform for students to help each other",
								color: "from-indigo-500 to-blue-500",
								delay: 0.6,
							},
						].map((item, i) => (
							<motion.div
								key={i}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: item.delay }}
							>
								<motion.div
									whileHover={{ y: -4, scale: 1.02 }}
									transition={{ duration: 0.2 }}
								>
									<Card className="h-full p-6 backdrop-blur-xl bg-white/5 border-white/10 hover:border-violet-500/50 transition-all duration-300 group">
										<motion.div
											whileHover={{ scale: 1.1, rotate: 5 }}
											transition={{ duration: 0.3 }}
											className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 shadow-lg group-hover:shadow-xl group-hover:shadow-violet-500/20 transition-all`}
										>
											<item.icon className="w-7 h-7 text-white" />
										</motion.div>
										<h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">
											{item.title}
										</h3>
										<p className="text-sm text-gray-400 leading-relaxed">
											{item.desc}
										</p>
									</Card>
								</motion.div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Stats & Social Proof */}
			<section className="py-16 px-4 bg-gradient-to-b from-violet-950/10 to-transparent">
				<div className="container-custom max-w-6xl mx-auto">
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="text-center"
					>
						<Card className="p-8 md:p-12 backdrop-blur-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
							<h3 className="text-2xl md:text-3xl font-bold text-white mb-8">
								Trusted by Students Across Amity
							</h3>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
								{[
									{ icon: Users, value: "500+", label: "Active Users" },
									{
										icon: Lightbulb,
										value: "1500+",
										label: "Predictions Made",
									},
									{ icon: Award, value: "89%", label: "Accuracy Rate" },
									{ icon: Clock, value: "<5s", label: "Avg Response Time" },
								].map((stat, i) => (
									<motion.div
										key={i}
										initial={{ opacity: 0, y: 20 }}
										whileInView={{ opacity: 1, y: 0 }}
										viewport={{ once: true }}
										transition={{ duration: 0.5, delay: i * 0.1 }}
										className="text-center"
									>
										<stat.icon className="w-8 h-8 mx-auto mb-3 text-violet-400" />
										<p className="text-3xl md:text-4xl font-bold text-white mb-2">
											{stat.value}
										</p>
										<p className="text-sm text-gray-400">{stat.label}</p>
									</motion.div>
								))}
							</div>
						</Card>
					</motion.div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 px-4 pb-safe md:pb-32">
				<div className="container-custom max-w-5xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
					>
						<Card className="relative overflow-hidden p-12 md:p-16 text-center backdrop-blur-xl bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-pink-500/20 border-violet-500/30">
							{/* Animated background gradient */}
							<motion.div
								animate={{
									scale: [1, 1.2, 1],
									rotate: [0, 180, 360],
									opacity: [0.3, 0.5, 0.3],
								}}
								transition={{
									duration: 20,
									repeat: Infinity,
									ease: "easeInOut",
								}}
								className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full blur-3xl opacity-30"
							/>

							<div className="relative z-10">
								<motion.div
									initial={{ scale: 0 }}
									whileInView={{ scale: 1 }}
									viewport={{ once: true }}
									transition={{ duration: 0.5, delay: 0.2 }}
								>
									<Rocket className="w-16 h-16 mx-auto mb-6 text-violet-400" />
								</motion.div>

								<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
									Ready to Ace Your Exams?
								</h2>
								<p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
									Join hundreds of students using AI to prepare smarter, not
									harder. Start predicting exam questions today.
								</p>

								<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
									<SignedOut>
										<SignInButton mode="modal">
											<motion.div
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
											>
												<Button
													size="lg"
													className="text-base px-8"
													rightIcon={<ArrowRight className="w-5 h-5" />}
												>
													Get Started Free
												</Button>
											</motion.div>
										</SignInButton>
									</SignedOut>
									<SignedIn>
										<Link href="/dashboard">
											<motion.div
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
											>
												<Button
													size="lg"
													className="text-base px-8"
													rightIcon={<ArrowRight className="w-5 h-5" />}
												>
													Go to Dashboard
												</Button>
											</motion.div>
										</Link>
									</SignedIn>
									<Link href="/notes">
										<motion.div
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
										>
											<Button
												variant="secondary"
												size="lg"
												className="text-base px-8"
											>
												Browse Notes
											</Button>
										</motion.div>
									</Link>
								</div>

								{/* Trust indicators */}
								<div className="flex flex-wrap items-center justify-center gap-6 mt-10">
									{[
										{ icon: Shield, text: "100% Free" },
										{ icon: Users, text: "500+ Students" },
										{ icon: Star, text: "89% Accuracy" },
									].map((item, i) => (
										<motion.div
											key={i}
											initial={{ opacity: 0, y: 10 }}
											whileInView={{ opacity: 1, y: 0 }}
											viewport={{ once: true }}
											transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
											className="flex items-center gap-2 text-sm text-gray-400"
										>
											<item.icon className="w-4 h-4 text-violet-400" />
											<span>{item.text}</span>
										</motion.div>
									))}
								</div>
							</div>
						</Card>
					</motion.div>
				</div>
			</section>

			{/* Footer - Desktop only */}
			<footer className="hidden md:block py-12 px-4 border-t border-white/5 bg-gradient-to-b from-transparent to-violet-950/10">
				<div className="container-custom max-w-7xl mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
						{/* Brand */}
						<div className="col-span-1">
							<div className="flex items-center gap-2 mb-4">
								<motion.div
									whileHover={{ rotate: 360 }}
									transition={{ duration: 0.6 }}
									className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center"
								>
									<Sparkles className="w-4 h-4 text-white" />
								</motion.div>
								<span className="text-lg font-bold text-white">
									AmityMate.ai
								</span>
							</div>
							<p className="text-sm text-gray-400 leading-relaxed">
								AI-powered exam question prediction for Amity University
								students.
							</p>
						</div>

						{/* Quick Links */}
						<div>
							<h4 className="text-sm font-semibold text-white mb-4">
								Quick Links
							</h4>
							<ul className="space-y-2">
								{[
									{ label: "Dashboard", href: "/dashboard" },
									{ label: "Predict Questions", href: "/predict" },
									{ label: "Browse Notes", href: "/notes" },
									{ label: "Upload Notes", href: "/upload" },
								].map((link, i) => (
									<li key={i}>
										<Link
											href={link.href}
											className="text-sm text-gray-400 hover:text-violet-400 transition-colors"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Resources */}
						<div>
							<h4 className="text-sm font-semibold text-white mb-4">
								Resources
							</h4>
							<ul className="space-y-2">
								{[
									{ label: "How It Works", href: "#how-it-works" },
									{ label: "Features", href: "#features" },
									{ label: "Analytics", href: "/admin/analytics" },
									{ label: "Admin Panel", href: "/admin" },
								].map((link, i) => (
									<li key={i}>
										<Link
											href={link.href}
											className="text-sm text-gray-400 hover:text-violet-400 transition-colors"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Legal */}
						<div>
							<h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
							<ul className="space-y-2">
								<li>
									<span className="text-sm text-gray-400">Privacy Policy</span>
								</li>
								<li>
									<span className="text-sm text-gray-400">
										Terms of Service
									</span>
								</li>
								<li>
									<span className="text-sm text-gray-400">
										Academic Integrity
									</span>
								</li>
								<li>
									<span className="text-sm text-gray-400">Contact Us</span>
								</li>
							</ul>
						</div>
					</div>

					{/* Bottom Bar */}
					<div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
						<p className="text-sm text-gray-500">
							© 2025 AmityMate.ai. All rights reserved.
						</p>
						<div className="flex items-center gap-2 text-sm text-gray-400">
							<BookOpen className="w-4 h-4 text-violet-400" />
							<span>Built for Amity University Patna Students</span>
						</div>
					</div>
				</div>
			</footer>

			<BottomNav />
		</div>
	);
}
