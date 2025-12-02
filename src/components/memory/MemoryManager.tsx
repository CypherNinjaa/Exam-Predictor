"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Badge, Input } from "@/components/ui";
import {
	Brain,
	Plus,
	Edit2,
	Trash2,
	Search,
	Download,
	X,
	Check,
	BookOpen,
	User,
	Settings,
	Target,
	Clock,
	MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Memory {
	id: string;
	title: string;
	content: string;
	category: string;
	importance: string;
	keywords: string[];
	timesUsed: number;
	lastUsedAt: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	source: string;
}

interface MemoryManagerProps {
	compact?: boolean;
	maxDisplay?: number;
}

const CATEGORY_CONFIG = {
	ACADEMIC: {
		icon: BookOpen,
		color: "violet",
		label: "Academic",
	},
	PERSONAL: {
		icon: User,
		color: "blue",
		label: "Personal",
	},
	PREFERENCES: {
		icon: Settings,
		color: "purple",
		label: "Preferences",
	},
	GOALS: {
		icon: Target,
		color: "green",
		label: "Goals",
	},
	STUDY_PATTERN: {
		icon: Clock,
		color: "yellow",
		label: "Study Pattern",
	},
	OTHER: {
		icon: MoreHorizontal,
		color: "gray",
		label: "Other",
	},
};

export default function MemoryManager({
	compact = false,
	maxDisplay = 50,
}: MemoryManagerProps) {
	const [memories, setMemories] = useState<Memory[]>([]);
	const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editForm, setEditForm] = useState({
		title: "",
		content: "",
		category: "OTHER",
		importance: "MEDIUM",
	});
	const [showAddForm, setShowAddForm] = useState(false);
	const [newMemory, setNewMemory] = useState({
		title: "",
		content: "",
		category: "OTHER",
		importance: "MEDIUM",
		keywords: "",
	});
	const [stats, setStats] = useState<any>(null);

	useEffect(() => {
		fetchMemories();
	}, []);

	useEffect(() => {
		filterMemories();
	}, [memories, searchQuery, selectedCategory]);

	const fetchMemories = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/memory");
			const data = await response.json();
			setMemories(data.memories || []);
			setStats(data.stats);
		} catch (error) {
			console.error("Failed to fetch memories:", error);
		} finally {
			setLoading(false);
		}
	};

	const filterMemories = () => {
		let filtered = [...memories];

		if (selectedCategory) {
			filtered = filtered.filter((m) => m.category === selectedCategory);
		}

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(m) =>
					m.title.toLowerCase().includes(query) ||
					m.content.toLowerCase().includes(query) ||
					m.keywords.some((k) => k.toLowerCase().includes(query))
			);
		}

		setFilteredMemories(filtered);
	};

	const handleCreate = async () => {
		try {
			const keywordsArray = newMemory.keywords
				.split(",")
				.map((k) => k.trim())
				.filter((k) => k);

			const response = await fetch("/api/memory", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...newMemory,
					keywords: keywordsArray,
				}),
			});

			if (response.ok) {
				setNewMemory({
					title: "",
					content: "",
					category: "OTHER",
					importance: "MEDIUM",
					keywords: "",
				});
				setShowAddForm(false);
				fetchMemories();
			}
		} catch (error) {
			console.error("Failed to create memory:", error);
		}
	};

	const handleUpdate = async (id: string) => {
		try {
			const response = await fetch(`/api/memory/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(editForm),
			});

			if (response.ok) {
				setEditingId(null);
				fetchMemories();
			}
		} catch (error) {
			console.error("Failed to update memory:", error);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this memory?")) return;

		try {
			const response = await fetch(`/api/memory/${id}`, {
				method: "DELETE",
			});

			if (response.ok) {
				fetchMemories();
			}
		} catch (error) {
			console.error("Failed to delete memory:", error);
		}
	};

	const handleToggleActive = async (id: string, isActive: boolean) => {
		try {
			await fetch(`/api/memory/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isActive: !isActive }),
			});
			fetchMemories();
		} catch (error) {
			console.error("Failed to toggle memory:", error);
		}
	};

	const exportMemories = () => {
		const dataStr = JSON.stringify(memories, null, 2);
		const dataBlob = new Blob([dataStr], { type: "application/json" });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `memories-${new Date().toISOString().split("T")[0]}.json`;
		link.click();
	};

	const getCategoryConfig = (category: string) => {
		return (
			CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] ||
			CATEGORY_CONFIG.OTHER
		);
	};

	if (loading) {
		return (
			<Card variant="glass" className="p-8">
				<div className="flex items-center justify-center gap-3">
					<Brain className="w-5 h-5 animate-pulse text-violet-400" />
					<p className="text-gray-400">Loading memories...</p>
				</div>
			</Card>
		);
	}

	return (
		<div className="h-full flex flex-col bg-gray-900 overflow-hidden">
			{/* Header */}
			{!compact && (
				<div className="flex-shrink-0 p-6 border-b border-gray-800">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-xl bg-violet-500/20">
								<Brain className="w-6 h-6 text-violet-400" />
							</div>
							<div>
								<h2 className="text-xl font-bold text-white">AI Memory</h2>
								<p className="text-xs text-gray-400">
									{memories.length} memories stored
								</p>
							</div>
						</div>
						<div className="flex gap-2">
							<Button
								onClick={exportMemories}
								variant="secondary"
								size="sm"
								className="gap-2"
							>
								<Download className="w-4 h-4" />
								Export
							</Button>
						</div>
					</div>
					<Button
						onClick={() => setShowAddForm(true)}
						className="w-full gap-2"
						variant="primary"
					>
						<Plus className="w-4 h-4" />
						Add Memory
					</Button>
				</div>
			)}

			{/* Stats */}
			{!compact && stats && (
				<div className="flex-shrink-0 px-6 py-4 border-b border-gray-800">
					<div className="grid grid-cols-3 gap-3">
						{Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
							const Icon = config.icon;
							const count =
								key === "ACADEMIC"
									? stats.academic
									: key === "PERSONAL"
									? stats.personal
									: key === "PREFERENCES"
									? stats.preferences
									: key === "GOALS"
									? stats.goals
									: key === "STUDY_PATTERN"
									? stats.studyPattern
									: stats.other;

							return (
								<button
									key={key}
									onClick={() =>
										setSelectedCategory(selectedCategory === key ? null : key)
									}
									className={cn(
										"p-3 rounded-xl border transition-all text-left",
										selectedCategory === key
											? "bg-violet-500/20 border-violet-500/50"
											: "bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50"
									)}
								>
									<div className="flex items-center gap-2 mb-1">
										<Icon className="w-4 h-4 text-violet-400" />
										<span className="text-xs text-gray-400">
											{config.label}
										</span>
									</div>
									<p className="text-xl font-bold text-white">{count}</p>
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* Search */}
			<div className="flex-shrink-0 px-6 py-4">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search memories..."
						className="w-full bg-gray-800/50 text-white placeholder-gray-500 px-10 py-2.5 rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
					/>
				</div>
			</div>

			{/* Add Form */}
			{showAddForm && (
				<div className="flex-shrink-0 mx-6 mb-4 p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-sm font-semibold text-white">Add New Memory</h3>
						<button
							onClick={() => setShowAddForm(false)}
							className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700/50"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
					<div className="space-y-3">
						<input
							value={newMemory.title}
							onChange={(e) =>
								setNewMemory({ ...newMemory, title: e.target.value })
							}
							placeholder="Memory title"
							className="w-full bg-gray-900/50 text-white placeholder-gray-500 px-3 py-2 rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
						/>
						<textarea
							value={newMemory.content}
							onChange={(e) =>
								setNewMemory({ ...newMemory, content: e.target.value })
							}
							placeholder="Memory content"
							className="w-full bg-gray-900/50 text-white placeholder-gray-500 px-3 py-2 rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent min-h-[80px] text-sm"
						/>
						<div className="grid grid-cols-2 gap-3">
							<select
								value={newMemory.category}
								onChange={(e) =>
									setNewMemory({ ...newMemory, category: e.target.value })
								}
								className="bg-gray-900/50 text-white px-3 py-2 rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
							>
								{Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
									<option key={key} value={key}>
										{config.label}
									</option>
								))}
							</select>
							<select
								value={newMemory.importance}
								onChange={(e) =>
									setNewMemory({ ...newMemory, importance: e.target.value })
								}
								className="bg-gray-900/50 text-white px-3 py-2 rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
							>
								<option value="LOW">Low</option>
								<option value="MEDIUM">Medium</option>
								<option value="HIGH">High</option>
								<option value="CRITICAL">Critical</option>
							</select>
						</div>
						<input
							value={newMemory.keywords}
							onChange={(e) =>
								setNewMemory({ ...newMemory, keywords: e.target.value })
							}
							placeholder="Keywords (comma separated)"
							className="w-full bg-gray-900/50 text-white placeholder-gray-500 px-3 py-2 rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
						/>
						<Button onClick={handleCreate} className="w-full" size="sm">
							Create Memory
						</Button>
					</div>
				</div>
			)}

			{/* Memories List */}
			<div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
				{filteredMemories
					.slice(0, compact ? maxDisplay : undefined)
					.map((memory) => {
						const config = getCategoryConfig(memory.category);
						const Icon = config.icon;
						const isEditing = editingId === memory.id;

						return (
							<div
								key={memory.id}
								className={cn(
									"p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl transition-all",
									!memory.isActive && "opacity-50"
								)}
							>
								<div className="flex items-start justify-between gap-4">
									<div className="flex items-start gap-3 flex-1">
										<div className="p-2 rounded-lg bg-violet-500/10">
											<Icon className="w-4 h-4 text-violet-400" />
										</div>
										<div className="flex-1 min-w-0">
											{isEditing ? (
												<div className="space-y-2">
													<input
														value={editForm.title}
														onChange={(e) =>
															setEditForm({
																...editForm,
																title: e.target.value,
															})
														}
														className="w-full bg-gray-900/50 text-white px-3 py-2 rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
													/>
													<textarea
														value={editForm.content}
														onChange={(e) =>
															setEditForm({
																...editForm,
																content: e.target.value,
															})
														}
														className="w-full bg-gray-900/50 text-white px-3 py-2 rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[60px] text-sm"
													/>
												</div>
											) : (
												<>
													<h4 className="text-white font-medium text-sm">
														{memory.title}
													</h4>
													<p className="text-xs text-gray-400 mt-1 line-clamp-2">
														{memory.content}
													</p>
												</>
											)}
											<div className="flex items-center gap-2 mt-3 flex-wrap">
												<span className="text-xs px-2 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
													{config.label}
												</span>
												<span
													className={cn(
														"text-xs px-2 py-1 rounded-full border",
														memory.importance === "CRITICAL"
															? "bg-red-500/10 text-red-400 border-red-500/20"
															: memory.importance === "HIGH"
															? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
															: memory.importance === "MEDIUM"
															? "bg-blue-500/10 text-blue-400 border-blue-500/20"
															: "bg-gray-500/10 text-gray-400 border-gray-500/20"
													)}
												>
													{memory.importance}
												</span>
												{memory.timesUsed > 0 && (
													<span className="text-xs text-gray-500">
														Used {memory.timesUsed}x
													</span>
												)}
											</div>
											{memory.keywords.length > 0 && (
												<div className="flex items-center gap-1 mt-2 flex-wrap">
													{memory.keywords.slice(0, 3).map((keyword, i) => (
														<span
															key={i}
															className="text-xs bg-gray-700/30 text-gray-400 px-2 py-0.5 rounded"
														>
															{keyword}
														</span>
													))}
													{memory.keywords.length > 3 && (
														<span className="text-xs text-gray-500">
															+{memory.keywords.length - 3} more
														</span>
													)}
												</div>
											)}
										</div>
									</div>
									<div className="flex items-center gap-1 flex-shrink-0">
										{isEditing ? (
											<>
												<button
													onClick={() => handleUpdate(memory.id)}
													className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors"
												>
													<Check className="w-3.5 h-3.5" />
												</button>
												<button
													onClick={() => setEditingId(null)}
													className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 transition-colors"
												>
													<X className="w-3.5 h-3.5" />
												</button>
											</>
										) : (
											<>
												<button
													onClick={() => {
														setEditingId(memory.id);
														setEditForm({
															title: memory.title,
															content: memory.content,
															category: memory.category,
															importance: memory.importance,
														});
													}}
													className="p-1.5 rounded-lg hover:bg-violet-500/20 text-violet-400 transition-colors"
												>
													<Edit2 className="w-3.5 h-3.5" />
												</button>
												<button
													onClick={() =>
														handleToggleActive(memory.id, memory.isActive)
													}
													className={cn(
														"p-1.5 rounded-lg transition-colors",
														memory.isActive
															? "hover:bg-yellow-500/20 text-yellow-400"
															: "hover:bg-green-500/20 text-green-400"
													)}
												>
													{memory.isActive ? (
														<Check className="w-3.5 h-3.5" />
													) : (
														<X className="w-3.5 h-3.5" />
													)}
												</button>
												<button
													onClick={() => handleDelete(memory.id)}
													className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</>
										)}
									</div>
								</div>
							</div>
						);
					})}
			</div>

			{filteredMemories.length === 0 && (
				<div className="flex-1 flex items-center justify-center px-6 pb-6">
					<div className="text-center">
						<Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
						<p className="text-gray-400 text-sm">
							{searchQuery || selectedCategory
								? "No memories found matching your filters"
								: "No memories yet. Start by adding one!"}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
