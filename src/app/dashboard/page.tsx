"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Navbar, BottomNav, MobileHeader } from "@/components/layout";
import { Button, Card, Badge } from "@/components/ui";
import {
	Sparkles,
	BookOpen,
	Brain,
	Upload,
	FileText,
	TrendingUp,
	Clock,
	Target,
	Award,
	MessageSquare,
	Download,
	Calendar,
	AlertCircle,
	ArrowRight,
	BarChart3,
	Zap,
	Users,
	Play,
} from "lucide-react";

interface DashboardStats {
	totalPredictions: number;
	totalSubjects: number;
	totalNotes: number;
	accuracyRate: number;
}

interface RecentActivity {
	id: string;
	type: "prediction" | "note" | "upload";
	title: string;
	subject: string;
	timestamp: string;
}

interface Subject {
	id: string;
	name: string;
	code: string;
	progress: number;
	upcomingExam?: {
		type: string;
		date: string;
		daysLeft: number;
	};
}

const quickActions = [
	{
		icon: Brain,
		title: "Predict Questions",
		description: "AI-powered exam predictions",
		href: "/predict",
		color: "from-violet-500 to-purple-600",
		delay: 0.1,
	},
	{
		icon: MessageSquare,
		title: "AI Chat",
		description: "Chat with AI assistant",
		href: "/chat",
		color: "from-blue-500 to-cyan-600",
		delay: 0.2,
	},
	{
		icon: BookOpen,
		title: "Browse Notes",
		description: "Study materials library",
		href: "/notes",
		color: "from-green-500 to-emerald-600",
		delay: 0.3,
	},
	{
		icon: Upload,
		title: "Upload Content",
		description: "Share notes & PYQs",
		href: "/upload",
		color: "from-orange-500 to-red-600",
		delay: 0.4,
	},
];

export default function DashboardPage() {
	const { user, isLoaded } = useUser();
	const [stats, setStats] = useState<DashboardStats>({
		totalPredictions: 0,
		totalSubjects: 0,
		totalNotes: 0,
		accuracyRate: 89,
	});
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadDashboardData();
	}, []);

	const loadDashboardData = async () => {
		try {
			// Load stats
			const statsRes = await fetch("/api/stats");
			const statsData = await statsRes.json();
			setStats({
				totalPredictions: statsData.predictions || 5,
				totalSubjects: statsData.subjects || 3,
				totalNotes: statsData.notes || 12,
				accuracyRate: 89,
			});

			// Mock subjects data (replace with API call)
			setSubjects([
				{
					id: "1",
					name: "Data Structures",
					code: "CS201",
					progress: 75,
					upcomingExam: {
						type: "MT1",
						date: "2025-12-15",
						daysLeft: 13,
					},
				},
				{
					id: "2",
					name: "Database Systems",
					code: "CS301",
					progress: 60,
					upcomingExam: {
						type: "MT1",
						date: "2025-12-18",
						daysLeft: 16,
					},
				},
				{
					id: "3",
					name: "Web Development",
					code: "CS401",
					progress: 85,
				},
			]);

			// Mock recent activity
			setRecentActivity([
				{
					id: "1",
					type: "prediction",
					title: "Generated MT1 predictions",
					subject: "Data Structures",
					timestamp: "2 hours ago",
				},
				{
					id: "2",
					type: "note",
					title: "Downloaded Python notes",
					subject: "Programming",
					timestamp: "5 hours ago",
				},
				{
					id: "3",
					type: "upload",
					title: "Uploaded PYQ 2024",
					subject: "Database Systems",
					timestamp: "1 day ago",
				},
			]);
		} catch (error) {
			console.error("Error loading dashboard data:", error);
		} finally {
			setLoading(false);
		}
	};

	if (!isLoaded || loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
				>
					<Sparkles className="h-8 w-8 text-violet-500" />
				</motion.div>
			</div>
		);
	}

	const getActivityIcon = (type: string) => {
		switch (type) {
			case "prediction":
				return Brain;
			case "note":
				return Download;
			case "upload":
				return Upload;
			default:
				return FileText;
		}
	};

	return (
		<div className="min-h-screen bg-background pb-safe">
			<Navbar />
			<MobileHeader />

			<main className="pt-safe md:pt-20 px-4 pb-24 md:pb-8">
				<div className="container-custom max-w-7xl mx-auto">
					{/* Welcome Section */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="mb-8 md:mb-12"
					>
						<h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
							Welcome back,{" "}
							<span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
								{user?.firstName || "Student"}!
							</span>
						</h1>
						<p className="text-gray-400 text-lg">
							Ready to ace your exams? Here's your overview.
						</p>
					</motion.div>

					{/* Quick Actions */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
						className="mb-8 md:mb-12"
					>
						<h2 className="text-2xl font-bold text-white mb-6">
							Quick Actions
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							{quickActions.map((action, i) => (
								<Link key={i} href={action.href}>
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.5, delay: action.delay }}
										whileHover={{ y: -4, scale: 1.02 }}
										className="group"
									>
										<Card className="p-6 h-full hover:border-violet-500/30 transition-all cursor-pointer">
											<div
												className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
											>
												<action.icon className="w-6 h-6 text-white" />
											</div>
											<h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">
												{action.title}
											</h3>
											<p className="text-sm text-gray-400">
												{action.description}
											</p>
											<ArrowRight className="w-5 h-5 text-gray-600 mt-4 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
										</Card>
									</motion.div>
								</Link>
							))}
						</div>
					</motion.div>
				</div>
			</main>

			<BottomNav />
		</div>
	);
}
