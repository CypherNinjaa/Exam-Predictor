"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
	BookOpen,
	FileText,
	FileQuestion,
	GraduationCap,
	Target,
	Layers,
	ArrowUpRight,
	Sparkles,
} from "lucide-react";
import { getAdminStats } from "./actions";
import Link from "next/link";

interface Stats {
	subjects: number;
	syllabi: number;
	questions: number;
	exams: number;
	modules: number;
	topics: number;
}

export default function AdminDashboard() {
	const [stats, setStats] = useState<Stats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchStats() {
			const result = await getAdminStats();
			if (result.success && result.data) {
				setStats(result.data);
			}
			setLoading(false);
		}
		fetchStats();
	}, []);

	const statCards = [
		{
			label: "Total Subjects",
			value: stats?.subjects || 0,
			icon: BookOpen,
			color: "purple",
			href: "/admin/subjects",
		},
		{
			label: "Syllabi",
			value: stats?.syllabi || 0,
			icon: FileText,
			color: "pink",
			href: "/admin/syllabi",
		},
		{
			label: "Questions",
			value: stats?.questions || 0,
			icon: FileQuestion,
			color: "cyan",
			href: "/admin/questions",
		},
		{
			label: "Exams",
			value: stats?.exams || 0,
			icon: GraduationCap,
			color: "amber",
			href: "/admin/exams",
		},
		{
			label: "Modules",
			value: stats?.modules || 0,
			icon: Layers,
			color: "green",
			href: "/admin/syllabi",
		},
		{
			label: "Topics",
			value: stats?.topics || 0,
			icon: Target,
			color: "orange",
			href: "/admin/syllabi",
		},
	];

	const colorClasses: Record<string, string> = {
		purple:
			"from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400",
		pink: "from-pink-500/20 to-pink-500/5 border-pink-500/30 text-pink-400",
		cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400",
		amber:
			"from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400",
		green:
			"from-green-500/20 to-green-500/5 border-green-500/30 text-green-400",
		orange:
			"from-orange-500/20 to-orange-500/5 border-orange-500/30 text-orange-400",
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
					{[...Array(6)].map((_, i) => (
						<div
							key={i}
							className="h-32 bg-white/5 rounded-2xl animate-pulse"
						/>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Welcome Section */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-6"
			>
				<div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
				<div className="relative">
					<div className="flex items-center gap-3 mb-2">
						<Sparkles className="w-6 h-6 text-amber-400" />
						<h1 className="text-2xl font-bold text-white">
							Welcome to Admin Dashboard
						</h1>
					</div>
					<p className="text-gray-400 max-w-2xl">
						Manage your exam predictor system. Upload syllabi, add questions,
						configure exams, and monitor predictions.
					</p>
				</div>
			</motion.div>

			{/* Stats Grid */}
			<div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
				{statCards.map((stat, index) => (
					<motion.div
						key={stat.label}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
					>
						<Link href={stat.href}>
							<motion.div
								whileHover={{ scale: 1.02, y: -2 }}
								whileTap={{ scale: 0.98 }}
								className={`relative bg-gradient-to-b ${
									colorClasses[stat.color]
								} backdrop-blur-xl rounded-2xl p-5 border cursor-pointer group overflow-hidden`}
							>
								<div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
									<ArrowUpRight className="w-4 h-4" />
								</div>

								<stat.icon className="w-8 h-8 mb-3" />
								<p className="text-3xl font-bold text-white mb-1">
									{stat.value}
								</p>
								<p className="text-sm text-gray-400">{stat.label}</p>
							</motion.div>
						</Link>
					</motion.div>
				))}
			</div>

			{/* Quick Actions */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5 }}
				className="card p-6"
			>
				<h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{[
						{
							label: "Add Subject",
							href: "/admin/subjects",
							icon: BookOpen,
							color: "purple",
						},
						{
							label: "Upload Syllabus",
							href: "/admin/upload",
							icon: FileText,
							color: "pink",
						},
						{
							label: "Add Question",
							href: "/admin/questions",
							icon: FileQuestion,
							color: "cyan",
						},
						{
							label: "Create Exam",
							href: "/admin/exams",
							icon: GraduationCap,
							color: "amber",
						},
					].map((action) => (
						<Link key={action.label} href={action.href}>
							<motion.div
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
							>
								<action.icon className={`w-5 h-5 text-${action.color}-400`} />
								<span className="text-sm font-medium text-white">
									{action.label}
								</span>
							</motion.div>
						</Link>
					))}
				</div>
			</motion.div>
		</div>
	);
}
