"use client";

import { useState, useEffect } from "react";
import {
	BarChart,
	Bar,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import {
	TrendingUp,
	Users,
	BookOpen,
	Sparkles,
	FileText,
	Activity,
} from "lucide-react";
import { Card, Badge } from "@/components/ui";

interface AnalyticsData {
	overview: {
		totalUsers: number;
		totalQuestions: number;
		totalNotes: number;
		totalPredictions: number;
		totalSubjects: number;
		activeUsers: number;
		timeRange: number;
	};
	userGrowth: { date: string; count: number }[];
	examTypes: { examType: string; count: number }[];
	topSubjects: {
		subjectId: string;
		subjectCode: string;
		subjectName: string;
		predictionsCount: number;
	}[];
	notesDownloads: {
		noteId: string;
		noteTitle: string;
		subjectCode: string;
		subjectName: string;
		downloads: number;
	}[];
	pyqCoverage: {
		data: { subjectCode: string; subjectName: string; examsCount: number }[];
		coveragePercentage: number;
		totalSubjects: number;
		subjectsWithPYQ: number;
	};
	modelUsage: {
		model: string;
		usageCount: number;
		avgConfidence: number;
		avgProcessingTime: number;
	}[];
}

const COLORS = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];

export default function AnalyticsPage() {
	const [data, setData] = useState<AnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [timeRange, setTimeRange] = useState("30");

	// Auto-sync current user on mount
	useEffect(() => {
		const syncCurrentUser = async () => {
			try {
				await fetch("/api/user/sync");
			} catch (error) {
				console.error("Failed to sync user:", error);
			}
		};
		syncCurrentUser();
	}, []);

	useEffect(() => {
		fetchAnalytics();
	}, [timeRange]);

	const fetchAnalytics = async () => {
		try {
			setLoading(true);
			const res = await fetch(`/api/admin/analytics?range=${timeRange}`);
			if (!res.ok) throw new Error("Failed to fetch analytics");

			const analyticsData = await res.json();
			setData(analyticsData);
		} catch (error) {
			console.error("Error fetching analytics:", error);
		} finally {
			setLoading(false);
		}
	};

	if (loading || !data) {
		return (
			<div className="min-h-screen bg-background p-6">
				<div className="animate-pulse">
					<div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<div key={i} className="h-32 bg-gray-800 rounded-2xl"></div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background p-6">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30">
							<TrendingUp className="w-6 h-6 text-violet-400" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">
								Analytics Dashboard
							</h1>
							<p className="text-gray-400 mt-1">
								Insights and statistics for the last {data.overview.timeRange}{" "}
								days
							</p>
						</div>
					</div>

					{/* Time Range Selector */}
					<select
						value={timeRange}
						onChange={(e) => setTimeRange(e.target.value)}
						className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-violet-500 focus:outline-none"
					>
						<option value="7">Last 7 days</option>
						<option value="30">Last 30 days</option>
						<option value="90">Last 90 days</option>
						<option value="365">Last year</option>
					</select>
				</div>
			</div>

			{/* Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
				<Card className="p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-400 text-sm font-medium">Total Users</p>
							<p className="text-3xl font-bold text-white mt-2">
								{data.overview.totalUsers}
							</p>
							<p className="text-green-400 text-sm mt-1">
								{data.overview.activeUsers} active
							</p>
						</div>
						<div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20">
							<Users className="w-8 h-8 text-violet-400" />
						</div>
					</div>
				</Card>

				<Card className="p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-400 text-sm font-medium">
								Total Questions
							</p>
							<p className="text-3xl font-bold text-white mt-2">
								{data.overview.totalQuestions.toLocaleString()}
							</p>
							<p className="text-gray-500 text-sm mt-1">
								{data.overview.totalSubjects} subjects
							</p>
						</div>
						<div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20">
							<BookOpen className="w-8 h-8 text-blue-400" />
						</div>
					</div>
				</Card>

				<Card className="p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-400 text-sm font-medium">
								Predictions Generated
							</p>
							<p className="text-3xl font-bold text-white mt-2">
								{data.overview.totalPredictions}
							</p>
							<p className="text-gray-500 text-sm mt-1">All time</p>
						</div>
						<div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20">
							<Sparkles className="w-8 h-8 text-purple-400" />
						</div>
					</div>
				</Card>

				<Card className="p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-400 text-sm font-medium">Public Notes</p>
							<p className="text-3xl font-bold text-white mt-2">
								{data.overview.totalNotes}
							</p>
							<p className="text-gray-500 text-sm mt-1">
								Available for download
							</p>
						</div>
						<div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20">
							<FileText className="w-8 h-8 text-green-400" />
						</div>
					</div>
				</Card>

				<Card className="p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-400 text-sm font-medium">PYQ Coverage</p>
							<p className="text-3xl font-bold text-white mt-2">
								{data.pyqCoverage.coveragePercentage}%
							</p>
							<p className="text-gray-500 text-sm mt-1">
								{data.pyqCoverage.subjectsWithPYQ} /{" "}
								{data.pyqCoverage.totalSubjects} subjects
							</p>
						</div>
						<div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-600/20">
							<Activity className="w-8 h-8 text-yellow-400" />
						</div>
					</div>
				</Card>
			</div>

			{/* Charts Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* User Growth Chart */}
				{data.userGrowth.length > 0 && (
					<Card className="p-6">
						<h3 className="text-xl font-bold text-white mb-4">User Growth</h3>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={data.userGrowth}>
								<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
								<XAxis
									dataKey="date"
									stroke="#9ca3af"
									tick={{ fill: "#9ca3af" }}
								/>
								<YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
								<Tooltip
									contentStyle={{
										backgroundColor: "#1f2937",
										border: "1px solid #374151",
										borderRadius: "8px",
									}}
								/>
								<Line
									type="monotone"
									dataKey="count"
									stroke="#8b5cf6"
									strokeWidth={2}
									dot={{ fill: "#8b5cf6" }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</Card>
				)}

				{/* Exam Types Distribution */}
				{data.examTypes.length > 0 && (
					<Card className="p-6">
						<h3 className="text-xl font-bold text-white mb-4">
							Predictions by Exam Type
						</h3>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={data.examTypes}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={(entry: any) => `${entry.examType}: ${entry.count}`}
									outerRadius={100}
									fill="#8884d8"
									dataKey="count"
								>
									{data.examTypes.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={COLORS[index % COLORS.length]}
										/>
									))}
								</Pie>
								<Tooltip
									contentStyle={{
										backgroundColor: "#1f2937",
										border: "1px solid #374151",
										borderRadius: "8px",
									}}
								/>
							</PieChart>
						</ResponsiveContainer>
					</Card>
				)}

				{/* Top Predicted Subjects */}
				{data.topSubjects.length > 0 && (
					<Card className="p-6">
						<h3 className="text-xl font-bold text-white mb-4">
							Most Predicted Subjects
						</h3>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={data.topSubjects}>
								<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
								<XAxis
									dataKey="subjectCode"
									stroke="#9ca3af"
									tick={{ fill: "#9ca3af" }}
								/>
								<YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
								<Tooltip
									contentStyle={{
										backgroundColor: "#1f2937",
										border: "1px solid #374151",
										borderRadius: "8px",
									}}
								/>
								<Bar
									dataKey="predictionsCount"
									fill="#8b5cf6"
									radius={[8, 8, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</Card>
				)}

				{/* Top Downloaded Notes */}
				{data.notesDownloads.length > 0 && (
					<Card className="p-6">
						<h3 className="text-xl font-bold text-white mb-4">
							Most Downloaded Notes
						</h3>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={data.notesDownloads}>
								<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
								<XAxis
									dataKey="subjectCode"
									stroke="#9ca3af"
									tick={{ fill: "#9ca3af" }}
								/>
								<YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
								<Tooltip
									contentStyle={{
										backgroundColor: "#1f2937",
										border: "1px solid #374151",
										borderRadius: "8px",
									}}
								/>
								<Bar dataKey="downloads" fill="#10b981" radius={[8, 8, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</Card>
				)}
			</div>

			{/* Model Usage Stats */}
			{data.modelUsage.length > 0 && (
				<Card className="p-6 mt-6">
					<h3 className="text-xl font-bold text-white mb-4">AI Model Usage</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{data.modelUsage.map((model) => (
							<div
								key={model.model}
								className="p-4 bg-white/5 rounded-xl border border-white/10"
							>
								<p className="text-white font-semibold">{model.model}</p>
								<div className="mt-2 space-y-1">
									<p className="text-sm text-gray-400">
										Uses: <span className="text-white">{model.usageCount}</span>
									</p>
									<p className="text-sm text-gray-400">
										Avg Confidence:{" "}
										<span className="text-white">
											{Math.round(model.avgConfidence * 100)}%
										</span>
									</p>
									<p className="text-sm text-gray-400">
										Avg Time:{" "}
										<span className="text-white">
											{Math.round(model.avgProcessingTime)}s
										</span>
									</p>
								</div>
							</div>
						))}
					</div>
				</Card>
			)}

			{/* PYQ Coverage Details */}
			{data.pyqCoverage.data.length > 0 && (
				<Card className="p-6 mt-6">
					<h3 className="text-xl font-bold text-white mb-4">
						PYQ Coverage by Subject
					</h3>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-white/5 border-b border-white/10">
								<tr>
									<th className="px-4 py-3 text-left text-sm font-semibold text-white">
										Subject Code
									</th>
									<th className="px-4 py-3 text-left text-sm font-semibold text-white">
										Subject Name
									</th>
									<th className="px-4 py-3 text-right text-sm font-semibold text-white">
										Exams Available
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-white/10">
								{data.pyqCoverage.data.map((subject) => (
									<tr key={subject.subjectCode} className="hover:bg-white/5">
										<td className="px-4 py-3 text-white font-medium">
											{subject.subjectCode}
										</td>
										<td className="px-4 py-3 text-gray-400">
											{subject.subjectName}
										</td>
										<td className="px-4 py-3 text-right">
											<Badge color="violet">{subject.examsCount} exams</Badge>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card>
			)}
		</div>
	);
}
