"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Search,
	FileText,
	Trash2,
	Eye,
	X,
	ChevronDown,
	ChevronRight,
	Layers,
	BookOpen,
	GraduationCap,
	Users,
} from "lucide-react";
import { getSyllabi, deleteSyllabus, getSyllabusById } from "../actions";
import Link from "next/link";

interface Syllabus {
	id: string;
	version: string | null;
	subjectId: string;
	createdAt: Date;
	subject: {
		id: string;
		code: string;
		name: string;
		semester: {
			number: number;
			batch: {
				startYear: number;
				endYear: number;
				course: {
					code: string;
					name: string;
				};
			};
		};
	};
	modules: Array<{
		id: string;
		number: number;
		name: string;
		topics: Array<{ id: string; name: string }>;
	}>;
	_count: {
		modules: number;
	};
}

interface SyllabusDetail {
	id: string;
	version: string | null;
	subject: {
		code: string;
		name: string;
		semester: {
			number: number;
			batch: {
				startYear: number;
				endYear: number;
				course: { code: string; name: string };
			};
		};
	};
	modules: Array<{
		id: string;
		number: number;
		name: string;
		hours: number | null;
		topics: Array<{
			id: string;
			name: string;
			subTopics: Array<{ id: string; name: string }>;
		}>;
	}>;
	books: Array<{
		id: string;
		title: string;
		author: string | null;
		publisher: string | null;
		bookType: string;
	}>;
	evaluation: any;
}

export default function SyllabiPage() {
	const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [isPending, startTransition] = useTransition();
	const [viewingId, setViewingId] = useState<string | null>(null);
	const [syllabusDetail, setSyllabusDetail] = useState<SyllabusDetail | null>(
		null
	);
	const [expandedModules, setExpandedModules] = useState<Set<string>>(
		new Set()
	);
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

	useEffect(() => {
		fetchSyllabi();
	}, []);

	async function fetchSyllabi() {
		const result = await getSyllabi();
		if (result.success && result.data) {
			setSyllabi(result.data as Syllabus[]);
		}
		setLoading(false);
	}

	async function handleView(id: string) {
		setViewingId(id);
		const result = await getSyllabusById(id);
		if (result.success && result.data) {
			setSyllabusDetail(result.data as SyllabusDetail);
		}
	}

	async function handleDelete(id: string) {
		if (!confirm("Are you sure you want to delete this syllabus?")) return;

		startTransition(async () => {
			const result = await deleteSyllabus(id);
			if (result.success) {
				fetchSyllabi();
			}
		});
	}

	const filteredSyllabi = syllabi.filter(
		(s) =>
			s.subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.subject.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Group syllabi by Course → Batch → Semester
	const groupedSyllabi = filteredSyllabi.reduce(
		(acc, syllabus) => {
			const course = syllabus.subject.semester.batch.course;
			const batch = syllabus.subject.semester.batch;
			const key = `${course.code}|${batch.startYear}-${batch.endYear}|Sem ${syllabus.subject.semester.number}`;

			if (!acc[key]) {
				acc[key] = {
					courseCode: course.code,
					courseName: course.name,
					batchLabel: `${batch.startYear}-${batch.endYear}`,
					semNumber: syllabus.subject.semester.number,
					items: [],
				};
			}
			acc[key].items.push(syllabus);
			return acc;
		},
		{} as Record<
			string,
			{
				courseCode: string;
				courseName: string;
				batchLabel: string;
				semNumber: number;
				items: Syllabus[];
			}
		>
	);

	const toggleModule = (moduleId: string) => {
		setExpandedModules((prev) => {
			const next = new Set(prev);
			if (next.has(moduleId)) {
				next.delete(moduleId);
			} else {
				next.add(moduleId);
			}
			return next;
		});
	};

	const toggleGroup = (key: string) => {
		setExpandedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-white">Syllabi</h1>
					<p className="text-gray-400 text-sm">
						View and manage uploaded syllabi
					</p>
				</div>

				<Link href="/admin/upload">
					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className="btn-primary flex items-center gap-2"
					>
						<FileText className="w-4 h-4" />
						Upload Syllabus
					</motion.button>
				</Link>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
				<input
					type="text"
					placeholder="Search syllabi..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="input w-full pl-12"
				/>
			</div>

			{/* Syllabi List */}
			{loading ? (
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className="h-32 bg-white/5 rounded-2xl animate-pulse"
						/>
					))}
				</div>
			) : filteredSyllabi.length === 0 ? (
				<div className="text-center py-16">
					<FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-400">
						No syllabi found
					</h3>
					<p className="text-gray-500 text-sm">
						{searchQuery
							? "Try a different search term"
							: "Upload your first syllabus to get started"}
					</p>
				</div>
			) : (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="space-y-4"
				>
					{Object.entries(groupedSyllabi)
						.sort((a, b) => a[0].localeCompare(b[0]))
						.map(([key, group]) => (
							<div
								key={key}
								className="border border-white/10 rounded-xl overflow-hidden"
							>
								{/* Group Header */}
								<button
									onClick={() => toggleGroup(key)}
									className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/[0.08] transition-colors"
								>
									<div className="flex items-center gap-3">
										{expandedGroups.has(key) ? (
											<ChevronDown className="w-5 h-5 text-gray-400" />
										) : (
											<ChevronRight className="w-5 h-5 text-gray-400" />
										)}
										<div className="flex items-center gap-2">
											<span className="badge-purple">{group.courseCode}</span>
											<span className="text-white font-medium">
												{group.batchLabel}
											</span>
											<span className="text-gray-400">•</span>
											<span className="text-gray-300">
												Semester {group.semNumber}
											</span>
										</div>
									</div>
									<span className="text-gray-500 text-sm">
										{group.items.length} syllabi
									</span>
								</button>

								{/* Syllabi */}
								{expandedGroups.has(key) && (
									<div className="divide-y divide-white/5">
										{group.items.map((syllabus) => (
											<div
												key={syllabus.id}
												className="flex items-center justify-between p-4 hover:bg-white/[0.03]"
											>
												<div className="flex items-center gap-4">
													<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
														<FileText className="w-6 h-6 text-pink-400" />
													</div>
													<div>
														<div className="flex items-center gap-2">
															<span className="text-white font-medium">
																{syllabus.subject.name}
															</span>
															<span className="badge-purple text-xs">
																{syllabus.subject.code}
															</span>
														</div>
														<div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
															<span className="badge-purple text-xs">
																v{syllabus.version || "1.0"}
															</span>
															<span className="flex items-center gap-1">
																<Layers className="w-3 h-3" />
																{syllabus._count.modules} modules
															</span>
															<span>
																Added{" "}
																{new Date(
																	syllabus.createdAt
																).toLocaleDateString()}
															</span>
														</div>
													</div>
												</div>
												<div className="flex items-center gap-1">
													<button
														onClick={() => handleView(syllabus.id)}
														className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
													>
														<Eye className="w-4 h-4" />
													</button>
													<button
														onClick={() => handleDelete(syllabus.id)}
														disabled={isPending}
														className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						))}
				</motion.div>
			)}

			{/* View Modal */}
			<AnimatePresence>
				{viewingId && syllabusDetail && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
						onClick={() => {
							setViewingId(null);
							setSyllabusDetail(null);
						}}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							onClick={(e) => e.stopPropagation()}
							className="bg-[#0f0f23] border border-white/10 rounded-2xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto"
						>
							<div className="flex items-center justify-between mb-6 sticky top-0 bg-[#0f0f23] pb-4 border-b border-white/10">
								<div>
									<h2 className="text-xl font-semibold text-white">
										{syllabusDetail.subject.name}
									</h2>
									<p className="text-pink-400 text-sm">
										{syllabusDetail.subject.code}
									</p>
									<p className="text-gray-500 text-xs mt-1">
										{syllabusDetail.subject.semester.batch.course.code}{" "}
										{syllabusDetail.subject.semester.batch.startYear}-
										{syllabusDetail.subject.semester.batch.endYear} • Semester{" "}
										{syllabusDetail.subject.semester.number}
									</p>
								</div>
								<button
									onClick={() => {
										setViewingId(null);
										setSyllabusDetail(null);
									}}
									className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
								>
									<X className="w-5 h-5" />
								</button>
							</div>

							{/* Modules */}
							<div className="space-y-4">
								<h3 className="text-lg font-semibold text-white flex items-center gap-2">
									<Layers className="w-5 h-5 text-cyan-400" />
									Modules
								</h3>

								<div className="space-y-2">
									{syllabusDetail.modules.map((module) => (
										<div
											key={module.id}
											className="rounded-xl border border-white/10 overflow-hidden"
										>
											<button
												onClick={() => toggleModule(module.id)}
												className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
											>
												<div className="flex items-center gap-3">
													<span className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-semibold">
														{module.number}
													</span>
													<div className="text-left">
														<p className="text-white font-medium">
															{module.name}
														</p>
														<p className="text-gray-500 text-sm">
															{module.topics?.length || 0} topics •{" "}
															{module.hours || 0} hours
														</p>
													</div>
												</div>
												{expandedModules.has(module.id) ? (
													<ChevronDown className="w-5 h-5 text-gray-400" />
												) : (
													<ChevronRight className="w-5 h-5 text-gray-400" />
												)}
											</button>

											{expandedModules.has(module.id) && (
												<motion.div
													initial={{ height: 0, opacity: 0 }}
													animate={{ height: "auto", opacity: 1 }}
													className="border-t border-white/10 bg-white/5"
												>
													<div className="p-4 space-y-3">
														{module.topics?.map((topic) => (
															<div key={topic.id} className="pl-4">
																<div className="flex items-center gap-2 text-gray-300">
																	<span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
																	{topic.name}
																</div>
																{topic.subTopics?.length > 0 && (
																	<div className="pl-6 mt-2 space-y-1">
																		{topic.subTopics.map((sub) => (
																			<div
																				key={sub.id}
																				className="text-sm text-gray-500 flex items-center gap-2"
																			>
																				<span className="w-1 h-1 rounded-full bg-gray-600" />
																				{sub.name}
																			</div>
																		))}
																	</div>
																)}
															</div>
														))}
													</div>
												</motion.div>
											)}
										</div>
									))}
								</div>
							</div>

							{/* Books */}
							{syllabusDetail.books?.length > 0 && (
								<div className="mt-6 space-y-4">
									<h3 className="text-lg font-semibold text-white flex items-center gap-2">
										<BookOpen className="w-5 h-5 text-amber-400" />
										Reference Books
									</h3>

									<div className="space-y-2">
										{syllabusDetail.books.map((book) => (
											<div
												key={book.id}
												className="p-3 rounded-xl bg-white/5 border border-white/5"
											>
												<p className="text-white font-medium">{book.title}</p>
												<p className="text-gray-500 text-sm">
													by {book.author}
													{book.publisher && ` • ${book.publisher}`}
												</p>
												<span
													className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
														book.bookType === "TEXTBOOK"
															? "bg-green-500/20 text-green-400"
															: "bg-blue-500/20 text-blue-400"
													}`}
												>
													{book.bookType}
												</span>
											</div>
										))}
									</div>
								</div>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
