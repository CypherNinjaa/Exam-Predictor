"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

interface DashboardStats {
	totalSubjects: number;
	totalExams: number;
	totalQuestions: number;
	processedPapers: number;
	pendingPapers: number;
}

interface RecentActivity {
	id: string;
	action: string;
	details: string;
	time: string;
}

interface TopicPrediction {
	topic: string;
	probability: number;
	module: string;
	lastAsked: string;
}

export default function DashboardPage() {
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [activities, setActivities] = useState<RecentActivity[]>([]);
	const [predictions, setPredictions] = useState<TopicPrediction[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([
			fetch("/api/dashboard/stats").then((r) => r.json()),
			fetch("/api/dashboard/activities").then((r) => r.json()),
			fetch("/api/dashboard/top-predictions").then((r) => r.json()),
		])
			.then(([statsData, activitiesData, predictionsData]) => {
				setStats(statsData);
				setActivities(activitiesData.activities || []);
				setPredictions(predictionsData.predictions || []);
			})
			.catch(console.error)
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<Navbar />

			<main className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold mb-8">📊 Dashboard</h1>

				{/* Stats Grid */}
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
					<StatsCard
						icon="📚"
						value={stats?.totalSubjects || 0}
						label="Subjects"
					/>
					<StatsCard icon="📝" value={stats?.totalExams || 0} label="Exams" />
					<StatsCard
						icon="❓"
						value={stats?.totalQuestions || 0}
						label="Questions"
					/>
					<StatsCard
						icon="✅"
						value={stats?.processedPapers || 0}
						label="Processed"
						color="text-green-400"
					/>
					<StatsCard
						icon="⏳"
						value={stats?.pendingPapers || 0}
						label="Pending"
						color="text-yellow-400"
					/>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Top Predictions */}
					<div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10">
						<h2 className="text-xl font-bold mb-4 flex items-center gap-2">
							🎯 Top Predicted Topics
						</h2>
						{predictions.length === 0 ? (
							<p className="text-gray-400 text-center py-8">
								No predictions yet. Upload exam papers to get started!
							</p>
						) : (
							<div className="space-y-3">
								{predictions.map((pred, i) => (
									<PredictionRow key={i} prediction={pred} rank={i + 1} />
								))}
							</div>
						)}
					</div>

					{/* Recent Activity */}
					<div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10">
						<h2 className="text-xl font-bold mb-4 flex items-center gap-2">
							🕐 Recent Activity
						</h2>
						{activities.length === 0 ? (
							<p className="text-gray-400 text-center py-8">
								No recent activity. Start by uploading some data!
							</p>
						) : (
							<div className="space-y-3">
								{activities.map((activity) => (
									<ActivityRow key={activity.id} activity={activity} />
								))}
							</div>
						)}
					</div>
				</div>

				{/* Quick Actions */}
				<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
					<QuickAction
						href="/upload"
						icon="📤"
						title="Upload Exam Paper"
						description="Add new exam papers for analysis"
					/>
					<QuickAction
						href="/upload?type=syllabus"
						icon="📘"
						title="Upload Syllabus"
						description="Add subject syllabus documents"
					/>
					<QuickAction
						href="/predict"
						icon="🔮"
						title="Generate Predictions"
						description="Create new exam predictions"
					/>
				</div>
			</main>
		</div>
	);
}

function StatsCard({
	icon,
	value,
	label,
	color = "text-white",
}: {
	icon: string;
	value: number;
	label: string;
	color?: string;
}) {
	return (
		<div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/10">
			<span className="text-2xl">{icon}</span>
			<p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
			<p className="text-sm text-gray-400">{label}</p>
		</div>
	);
}

function PredictionRow({
	prediction,
	rank,
}: {
	prediction: TopicPrediction;
	rank: number;
}) {
	const probabilityColor =
		prediction.probability >= 0.7
			? "bg-red-500"
			: prediction.probability >= 0.4
			? "bg-yellow-500"
			: "bg-green-500";

	return (
		<div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
			<span className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
				{rank}
			</span>
			<div className="flex-1">
				<p className="font-medium text-white">{prediction.topic}</p>
				<p className="text-xs text-gray-400">
					{prediction.module} • Last: {prediction.lastAsked}
				</p>
			</div>
			<div className="text-right">
				<div className="flex items-center gap-2">
					<div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
						<div
							className={`h-full ${probabilityColor}`}
							style={{ width: `${prediction.probability * 100}%` }}
						/>
					</div>
					<span className="text-sm font-semibold">
						{Math.round(prediction.probability * 100)}%
					</span>
				</div>
			</div>
		</div>
	);
}

function ActivityRow({ activity }: { activity: RecentActivity }) {
	return (
		<div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
			<div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
			<div className="flex-1">
				<p className="font-medium text-white">{activity.action}</p>
				<p className="text-sm text-gray-400">{activity.details}</p>
			</div>
			<span className="text-xs text-gray-500">{activity.time}</span>
		</div>
	);
}

function QuickAction({
	href,
	icon,
	title,
	description,
}: {
	href: string;
	icon: string;
	title: string;
	description: string;
}) {
	return (
		<Link href={href}>
			<div
				className="bg-white/5 hover:bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/10 
        cursor-pointer transition-all duration-200 hover:border-purple-500/50"
			>
				<span className="text-2xl">{icon}</span>
				<h3 className="font-semibold mt-2">{title}</h3>
				<p className="text-sm text-gray-400">{description}</p>
			</div>
		</Link>
	);
}
