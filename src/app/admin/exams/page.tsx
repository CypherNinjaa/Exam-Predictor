"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Plus,
	Search,
	Trash2,
	GraduationCap,
	X,
	Loader2,
	Calendar,
	FileQuestion,
	ChevronDown,
	ChevronRight,
} from "lucide-react";
import {
	getExams,
	createExam,
	deleteExam,
	getCourses,
	getBatches,
	getSemesters,
	getSubjects,
} from "../actions";

interface Exam {
	id: string;
	examType: string;
	examDate: Date | null;
	totalMarks: number;
	subjectId: string;
	semesterId: string;
	subject: {
		id: string;
		code: string;
		name: string;
	};
	semester: {
		number: number;
		batch: {
			startYear: number;
			endYear: number;
			course: { code: string; name: string };
		};
	};
	_count: {
		questions: number;
	};
}

interface Course {
	id: string;
	code: string;
	name: string;
}

interface Batch {
	id: string;
	startYear: number;
	endYear: number;
	courseId: string;
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
	semesterId: string;
}

export default function ExamsPage() {
	const [exams, setExams] = useState<Exam[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterType, setFilterType] = useState<string>("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState("");

	// Form data
	const [courses, setCourses] = useState<Course[]>([]);
	const [batches, setBatches] = useState<Batch[]>([]);
	const [semesters, setSemesters] = useState<Semester[]>([]);
	const [subjects, setSubjects] = useState<Subject[]>([]);

	// Form selections
	const [selectedCourseId, setSelectedCourseId] = useState("");
	const [selectedBatchId, setSelectedBatchId] = useState("");
	const [selectedSemesterId, setSelectedSemesterId] = useState("");
	const [selectedSubjectId, setSelectedSubjectId] = useState("");

	// Expanded groups
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

	useEffect(() => {
		fetchData();
	}, []);

	async function fetchData() {
		const [examsResult, coursesResult] = await Promise.all([
			getExams(),
			getCourses(),
		]);

		if (examsResult.success && examsResult.data) {
			setExams(examsResult.data as Exam[]);
		}
		if (coursesResult.success && coursesResult.data) {
			setCourses(coursesResult.data);
		}
		setLoading(false);
	}

	// Cascading dropdowns
	useEffect(() => {
		async function loadBatches() {
			if (selectedCourseId) {
				const result = await getBatches(selectedCourseId);
				if (result.success && result.data) {
					setBatches(result.data as Batch[]);
				}
			} else {
				setBatches([]);
			}
			setSelectedBatchId("");
			setSemesters([]);
			setSelectedSemesterId("");
			setSubjects([]);
			setSelectedSubjectId("");
		}
		loadBatches();
	}, [selectedCourseId]);

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
			setSubjects([]);
			setSelectedSubjectId("");
		}
		loadSemesters();
	}, [selectedBatchId]);

	useEffect(() => {
		async function loadSubjects() {
			if (selectedSemesterId) {
				const result = await getSubjects(selectedSemesterId);
				if (result.success && result.data) {
					setSubjects(result.data as Subject[]);
				}
			} else {
				setSubjects([]);
			}
			setSelectedSubjectId("");
		}
		loadSubjects();
	}, [selectedSemesterId]);

	const filteredExams = exams.filter((e) => {
		const matchesSearch =
			e.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			e.subject?.code?.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesType = !filterType || e.examType === filterType;
		return matchesSearch && matchesType;
	});

	// Group by Course → Batch → Semester
	const groupedExams = filteredExams.reduce(
		(acc, exam) => {
			const course = exam.semester.batch.course;
			const batch = exam.semester.batch;
			const key = `${course.code}|${batch.startYear}-${batch.endYear}|Sem ${exam.semester.number}`;

			if (!acc[key]) {
				acc[key] = {
					courseCode: course.code,
					batchLabel: `${batch.startYear}-${batch.endYear}`,
					semNumber: exam.semester.number,
					items: [],
				};
			}
			acc[key].items.push(exam);
			return acc;
		},
		{} as Record<
			string,
			{
				courseCode: string;
				batchLabel: string;
				semNumber: number;
				items: Exam[];
			}
		>
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

		if (!selectedSubjectId || !selectedSemesterId) {
			setError("Please select all required fields");
			return;
		}

		const formData = new FormData(e.currentTarget);
		formData.append("subjectId", selectedSubjectId);
		formData.append("semesterId", selectedSemesterId);

		startTransition(async () => {
			const result = await createExam(formData);

			if (result.success) {
				setIsModalOpen(false);
				setSelectedCourseId("");
				setSelectedBatchId("");
				setSelectedSemesterId("");
				setSelectedSubjectId("");
				fetchData();
			} else {
				setError(result.error || "Something went wrong");
			}
		});
	}

	async function handleDelete(id: string) {
		if (!confirm("Are you sure you want to delete this exam?")) return;

		startTransition(async () => {
			const result = await deleteExam(id);
			if (result.success) {
				fetchData();
			}
		});
	}

	const examTypeLabel = (type: string) => {
		switch (type) {
			case "MIDTERM_1":
				return "Midterm 1";
			case "MIDTERM_2":
				return "Midterm 2";
			case "END_TERM":
				return "End Term";
			default:
				return type;
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-white">Exams</h1>
					<p className="text-gray-400 text-sm">
						Manage exam papers and questions
					</p>
				</div>

				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={() => setIsModalOpen(true)}
					className="btn-primary flex items-center gap-2"
				>
					<Plus className="w-4 h-4" />
					Add Exam
				</motion.button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap gap-4">
				<div className="relative flex-1 min-w-[200px]">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
					<input
						type="text"
						placeholder="Search exams..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="input w-full pl-12"
					/>
				</div>

				<select
					value={filterType}
					onChange={(e) => setFilterType(e.target.value)}
					className="select w-40"
				>
					<option value="">All Types</option>
					<option value="MIDTERM_1">Midterm 1</option>
					<option value="MIDTERM_2">Midterm 2</option>
					<option value="END_TERM">End Term</option>
				</select>
			</div>

			{/* Exams List */}
			{loading ? (
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className="h-20 bg-white/5 rounded-2xl animate-pulse"
						/>
					))}
				</div>
			) : filteredExams.length === 0 ? (
				<div className="text-center py-16">
					<GraduationCap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-400">No exams found</h3>
					<p className="text-gray-500 text-sm">
						Add your first exam to get started
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{Object.entries(groupedExams)
						.sort((a, b) => a[0].localeCompare(b[0]))
						.map(([key, group]) => (
							<div
								key={key}
								className="border border-white/10 rounded-xl overflow-hidden"
							>
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
										{group.items.length} exams
									</span>
								</button>

								{expandedGroups.has(key) && (
									<div className="divide-y divide-white/5">
										{group.items.map((exam) => (
											<div
												key={exam.id}
												className="flex items-center justify-between p-4 hover:bg-white/[0.03]"
											>
												<div className="flex items-center gap-4">
													<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
														<GraduationCap className="w-6 h-6 text-amber-400" />
													</div>
													<div>
														<div className="flex items-center gap-2">
															<span className="text-white font-medium">
																{exam.subject.name}
															</span>
															<span className="badge-purple text-xs">
																{exam.subject.code}
															</span>
														</div>
														<div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
															<span
																className={`px-2 py-0.5 rounded-full text-xs ${
																	exam.examType === "END_TERM"
																		? "bg-red-500/20 text-red-400"
																		: "bg-blue-500/20 text-blue-400"
																}`}
															>
																{examTypeLabel(exam.examType)}
															</span>
															<span>{exam.totalMarks} marks</span>
															<span className="flex items-center gap-1">
																<FileQuestion className="w-3 h-3" />
																{exam._count.questions} questions
															</span>
															{exam.examDate && (
																<span className="flex items-center gap-1">
																	<Calendar className="w-3 h-3" />
																	{new Date(exam.examDate).toLocaleDateString()}
																</span>
															)}
														</div>
													</div>
												</div>
												<button
													onClick={() => handleDelete(exam.id)}
													disabled={isPending}
													className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
												>
													<Trash2 className="w-4 h-4" />
												</button>
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
									Add New Exam
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
												Semester {s.number}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Subject *
									</label>
									<select
										value={selectedSubjectId}
										onChange={(e) => setSelectedSubjectId(e.target.value)}
										className="select w-full"
										disabled={!selectedSemesterId}
										required
									>
										<option value="">Select Subject</option>
										{subjects.map((s) => (
											<option key={s.id} value={s.id}>
												{s.code} - {s.name}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Exam Type *
									</label>
									<select name="examType" className="select w-full" required>
										<option value="">Select Type</option>
										<option value="MIDTERM_1">Midterm 1</option>
										<option value="MIDTERM_2">Midterm 2</option>
										<option value="END_TERM">End Term</option>
									</select>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-300 mb-2">
											Total Marks *
										</label>
										<input
											type="number"
											name="totalMarks"
											defaultValue={60}
											min={1}
											required
											className="input w-full"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-300 mb-2">
											Exam Date
										</label>
										<input type="date" name="date" className="input w-full" />
									</div>
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
												Adding...
											</>
										) : (
											"Add Exam"
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
