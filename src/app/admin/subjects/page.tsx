"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Plus,
	Search,
	Edit2,
	Trash2,
	BookOpen,
	X,
	Loader2,
	FileText,
	GraduationCap,
	ChevronDown,
	ChevronRight,
} from "lucide-react";
import {
	getSubjects,
	createSubject,
	updateSubject,
	deleteSubject,
	getCourses,
	getBatches,
	getSemesters,
} from "../actions";

interface Course {
	id: string;
	code: string;
	name: string;
	duration: number;
}

interface Batch {
	id: string;
	startYear: number;
	endYear: number;
	courseId: string;
	course: { name: string; code: string };
}

interface Semester {
	id: string;
	number: number;
	batchId: string;
}

interface Subject {
	id: string;
	code: string;
	name: string;
	credits: number;
	semesterId: string;
	semester: {
		number: number;
		batch: {
			startYear: number;
			endYear: number;
			course: { code: string; name: string };
		};
	};
	syllabus: { id: string } | null;
	_count: {
		exams: number;
	};
}

export default function SubjectsPage() {
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState("");

	// Form dropdown data
	const [courses, setCourses] = useState<Course[]>([]);
	const [batches, setBatches] = useState<Batch[]>([]);
	const [semesters, setSemesters] = useState<Semester[]>([]);

	// Form selections
	const [selectedCourseId, setSelectedCourseId] = useState("");
	const [selectedBatchId, setSelectedBatchId] = useState("");
	const [selectedSemesterId, setSelectedSemesterId] = useState("");

	// Grouping state
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

	useEffect(() => {
		fetchData();
	}, []);

	async function fetchData() {
		setLoading(true);
		const [subjectsResult, coursesResult] = await Promise.all([
			getSubjects(),
			getCourses(),
		]);
		if (subjectsResult.success && subjectsResult.data) {
			setSubjects(subjectsResult.data as Subject[]);
		}
		if (coursesResult.success && coursesResult.data) {
			setCourses(coursesResult.data);
		}
		setLoading(false);
	}

	// Load batches when course is selected in form
	useEffect(() => {
		async function loadBatches() {
			if (selectedCourseId) {
				const result = await getBatches(selectedCourseId);
				if (result.success && result.data) {
					setBatches(result.data);
				}
			} else {
				setBatches([]);
			}
			setSelectedBatchId("");
			setSemesters([]);
			setSelectedSemesterId("");
		}
		loadBatches();
	}, [selectedCourseId]);

	// Load semesters when batch is selected
	useEffect(() => {
		async function loadSemesters() {
			if (selectedBatchId) {
				const result = await getSemesters(selectedBatchId);
				if (result.success && result.data) {
					setSemesters(result.data as Semester[]);
				}
			} else {
				setSemesters([]);
			}
			setSelectedSemesterId("");
		}
		loadSemesters();
	}, [selectedBatchId]);

	// Group subjects by course → batch → semester
	const groupedSubjects = subjects.reduce(
		(acc, subject) => {
			const course = subject.semester.batch.course;
			const batch = subject.semester.batch;
			const courseKey = course.code;
			const batchKey = `${batch.startYear}-${batch.endYear}`;
			const semKey = `Sem ${subject.semester.number}`;
			const groupKey = `${courseKey}|${batchKey}|${semKey}`;

			if (!acc[groupKey]) {
				acc[groupKey] = {
					courseCode: courseKey,
					courseName: course.name,
					batchLabel: batchKey,
					semNumber: subject.semester.number,
					subjects: [],
				};
			}
			acc[groupKey].subjects.push(subject);
			return acc;
		},
		{} as Record<
			string,
			{
				courseCode: string;
				courseName: string;
				batchLabel: string;
				semNumber: number;
				subjects: Subject[];
			}
		>
	);

	const filteredGroups = Object.entries(groupedSubjects).filter(([_, group]) =>
		group.subjects.some(
			(s) =>
				s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.code.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function toggleGroup(key: string) {
		setExpandedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");

		const formData = new FormData(e.currentTarget);

		if (!editingSubject && !selectedSemesterId) {
			setError("Please select a semester");
			return;
		}

		if (!editingSubject) {
			formData.append("semesterId", selectedSemesterId);
		}

		startTransition(async () => {
			let result;
			if (editingSubject) {
				result = await updateSubject(editingSubject.id, formData);
			} else {
				result = await createSubject(formData);
			}

			if (result.success) {
				setIsModalOpen(false);
				setEditingSubject(null);
				setSelectedCourseId("");
				setSelectedBatchId("");
				setSelectedSemesterId("");
				fetchData();
			} else {
				setError(result.error || "Something went wrong");
			}
		});
	}

	async function handleDelete(id: string) {
		if (!confirm("Are you sure you want to delete this subject?")) return;

		startTransition(async () => {
			const result = await deleteSubject(id);
			if (result.success) {
				fetchData();
			}
		});
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-white">Subjects</h1>
					<p className="text-gray-400 text-sm">
						Manage subjects for each semester
					</p>
				</div>

				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={() => {
						setEditingSubject(null);
						setIsModalOpen(true);
					}}
					className="btn-primary flex items-center gap-2"
				>
					<Plus className="w-4 h-4" />
					Add Subject
				</motion.button>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
				<input
					type="text"
					placeholder="Search subjects..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="input w-full pl-12"
				/>
			</div>

			{/* Subjects List */}
			{loading ? (
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className="h-20 bg-white/5 rounded-2xl animate-pulse"
						/>
					))}
				</div>
			) : filteredGroups.length === 0 ? (
				<div className="text-center py-16">
					<BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-400">
						No subjects found
					</h3>
					<p className="text-gray-500 text-sm">
						{searchQuery
							? "Try a different search term"
							: "Add subjects to a semester to get started"}
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{filteredGroups
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
										{group.subjects.length} subjects
									</span>
								</button>

								{/* Subjects */}
								{expandedGroups.has(key) && (
									<div className="divide-y divide-white/5">
										{group.subjects.map((subject) => (
											<div
												key={subject.id}
												className="flex items-center justify-between p-4 hover:bg-white/[0.03]"
											>
												<div className="flex items-center gap-4">
													<div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
														<BookOpen className="w-5 h-5 text-violet-400" />
													</div>
													<div>
														<div className="flex items-center gap-2">
															<span className="text-white font-medium">
																{subject.name}
															</span>
															<span className="badge-purple text-xs">
																{subject.code}
															</span>
														</div>
														<div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
															<span>{subject.credits} credits</span>
															{subject.syllabus && (
																<span className="flex items-center gap-1">
																	<FileText className="w-3 h-3" />
																	Syllabus
																</span>
															)}
															<span className="flex items-center gap-1">
																<GraduationCap className="w-3 h-3" />
																{subject._count.exams} exams
															</span>
														</div>
													</div>
												</div>
												<div className="flex items-center gap-1">
													<button
														onClick={() => {
															setEditingSubject(subject);
															setIsModalOpen(true);
														}}
														className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
													>
														<Edit2 className="w-4 h-4" />
													</button>
													<button
														onClick={() => handleDelete(subject.id)}
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
				</div>
			)}

			{/* Modal */}
			<AnimatePresence>
				{isModalOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
						onClick={() => setIsModalOpen(false)}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							onClick={(e) => e.stopPropagation()}
							className="bg-[#0f0f23] border border-white/10 rounded-2xl p-6 w-full max-w-md"
						>
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-xl font-semibold text-white">
									{editingSubject ? "Edit Subject" : "Add New Subject"}
								</h2>
								<button
									onClick={() => setIsModalOpen(false)}
									className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
								>
									<X className="w-5 h-5" />
								</button>
							</div>

							{error && (
								<div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
									{error}
								</div>
							)}

							<form onSubmit={handleSubmit} className="space-y-4">
								{/* Semester Selection (only for new subjects) */}
								{!editingSubject && (
									<>
										<div>
											<label className="block text-sm font-medium text-gray-300 mb-2">
												Course *
											</label>
											<select
												value={selectedCourseId}
												onChange={(e) => setSelectedCourseId(e.target.value)}
												className="select w-full"
												required
											>
												<option value="">Select Course</option>
												{courses.map((c) => (
													<option key={c.id} value={c.id}>
														{c.code} - {c.name}
													</option>
												))}
											</select>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-300 mb-2">
												Batch *
											</label>
											<select
												value={selectedBatchId}
												onChange={(e) => setSelectedBatchId(e.target.value)}
												className="select w-full"
												disabled={!selectedCourseId}
												required
											>
												<option value="">Select Batch</option>
												{batches.map((b) => (
													<option key={b.id} value={b.id}>
														{b.startYear} - {b.endYear}
													</option>
												))}
											</select>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-300 mb-2">
												Semester *
											</label>
											<select
												value={selectedSemesterId}
												onChange={(e) => setSelectedSemesterId(e.target.value)}
												className="select w-full"
												disabled={!selectedBatchId}
												required
											>
												<option value="">Select Semester</option>
												{semesters.map((s) => (
													<option key={s.id} value={s.id}>
														Semester {s.number} (Year {Math.ceil(s.number / 2)})
													</option>
												))}
											</select>
										</div>
									</>
								)}

								{editingSubject && (
									<div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400">
										{editingSubject.semester.batch.course.code}{" "}
										{editingSubject.semester.batch.startYear}-
										{editingSubject.semester.batch.endYear} • Semester{" "}
										{editingSubject.semester.number}
									</div>
								)}

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Subject Code *
									</label>
									<input
										type="text"
										name="code"
										defaultValue={editingSubject?.code || ""}
										placeholder="e.g., BCA301"
										required
										className="input w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Subject Name *
									</label>
									<input
										type="text"
										name="name"
										defaultValue={editingSubject?.name || ""}
										placeholder="e.g., Database Management"
										required
										className="input w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Credits *
									</label>
									<input
										type="number"
										name="credits"
										defaultValue={editingSubject?.credits || 3}
										min={1}
										max={10}
										required
										className="input w-full"
									/>
								</div>

								<div className="flex items-center gap-3 pt-4">
									<button
										type="button"
										onClick={() => setIsModalOpen(false)}
										className="btn-secondary flex-1"
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={isPending}
										className="btn-primary flex-1 flex items-center justify-center gap-2"
									>
										{isPending ? (
											<>
												<Loader2 className="w-4 h-4 animate-spin" />
												Saving...
											</>
										) : editingSubject ? (
											"Update Subject"
										) : (
											"Add Subject"
										)}
									</button>
								</div>
							</form>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
