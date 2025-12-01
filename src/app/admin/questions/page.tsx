"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Plus,
	Search,
	Trash2,
	FileQuestion,
	X,
	Loader2,
	ChevronDown,
	ChevronRight,
	GraduationCap,
} from "lucide-react";
import {
	getQuestions,
	createQuestion,
	deleteQuestion,
	getCourses,
	getBatches,
	getSemesters,
	getSubjects,
	getExamsForSubject,
} from "../actions";

interface Question {
	id: string;
	text: string;
	marks: number;
	difficulty: string;
	exam: {
		id: string;
		examType: string;
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
	};
	module: { number: number; name: string } | null;
	topic: { name: string } | null;
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
}

interface Semester {
	id: string;
	number: number;
}

interface Subject {
	id: string;
	code: string;
	name: string;
}

interface Exam {
	id: string;
	examType: string;
	examDate: Date | null;
}

export default function QuestionsPage() {
	const [questions, setQuestions] = useState<Question[]>([]);
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
	const [exams, setExams] = useState<Exam[]>([]);

	// Form selections
	const [selectedCourseId, setSelectedCourseId] = useState("");
	const [selectedBatchId, setSelectedBatchId] = useState("");
	const [selectedSemesterId, setSelectedSemesterId] = useState("");
	const [selectedSubjectId, setSelectedSubjectId] = useState("");
	const [selectedExamId, setSelectedExamId] = useState("");

	// Expanded groups
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

	useEffect(() => {
		fetchData();
	}, []);

	async function fetchData() {
		const [questionsResult, coursesResult] = await Promise.all([
			getQuestions(),
			getCourses(),
		]);

		if (questionsResult.success && questionsResult.data) {
			setQuestions(questionsResult.data as Question[]);
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
			setExams([]);
			setSelectedExamId("");
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
			setExams([]);
			setSelectedExamId("");
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
			setExams([]);
			setSelectedExamId("");
		}
		loadSubjects();
	}, [selectedSemesterId]);

	useEffect(() => {
		async function loadExams() {
			if (selectedSubjectId) {
				const result = await getExamsForSubject(selectedSubjectId);
				if (result.success && result.data) {
					setExams(result.data as Exam[]);
				}
			} else {
				setExams([]);
			}
			setSelectedExamId("");
		}
		loadExams();
	}, [selectedSubjectId]);

	const filteredQuestions = questions.filter((q) => {
		const matchesSearch = q.text
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesDifficulty = !filterType || q.difficulty === filterType;
		return matchesSearch && matchesDifficulty;
	});

	// Group by Course → Batch → Subject
	const groupedQuestions = filteredQuestions.reduce(
		(acc, question) => {
			const exam = question.exam;
			const course = exam.semester.batch.course;
			const batch = exam.semester.batch;
			const key = `${course.code}|${batch.startYear}-${batch.endYear}|${exam.subject.code}`;

			if (!acc[key]) {
				acc[key] = {
					courseCode: course.code,
					batchLabel: `${batch.startYear}-${batch.endYear}`,
					subjectCode: exam.subject.code,
					subjectName: exam.subject.name,
					items: [],
				};
			}
			acc[key].items.push(question);
			return acc;
		},
		{} as Record<
			string,
			{
				courseCode: string;
				batchLabel: string;
				subjectCode: string;
				subjectName: string;
				items: Question[];
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

		if (!selectedExamId) {
			setError("Please select all required fields");
			return;
		}

		const formData = new FormData(e.currentTarget);
		formData.append("examId", selectedExamId);

		startTransition(async () => {
			const result = await createQuestion(formData);

			if (result.success) {
				setIsModalOpen(false);
				resetForm();
				fetchData();
			} else {
				setError(result.error || "Something went wrong");
			}
		});
	}

	function resetForm() {
		setSelectedCourseId("");
		setSelectedBatchId("");
		setSelectedSemesterId("");
		setSelectedSubjectId("");
		setSelectedExamId("");
	}

	async function handleDelete(id: string) {
		if (!confirm("Are you sure you want to delete this question?")) return;

		startTransition(async () => {
			const result = await deleteQuestion(id);
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

	const difficultyLabel = (diff: string) => {
		switch (diff) {
			case "EASY":
				return "Easy";
			case "MEDIUM":
				return "Medium";
			case "HARD":
				return "Hard";
			default:
				return diff;
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-white">Questions</h1>
					<p className="text-gray-400 text-sm">Manage exam questions</p>
				</div>

				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={() => setIsModalOpen(true)}
					className="btn-primary flex items-center gap-2"
				>
					<Plus className="w-4 h-4" />
					Add Question
				</motion.button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap gap-4">
				<div className="relative flex-1 min-w-[200px]">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
					<input
						type="text"
						placeholder="Search questions..."
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
					<option value="">All Difficulty</option>
					<option value="EASY">Easy</option>
					<option value="MEDIUM">Medium</option>
					<option value="HARD">Hard</option>
				</select>
			</div>

			{/* Questions List */}
			{loading ? (
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className="h-20 bg-white/5 rounded-2xl animate-pulse"
						/>
					))}
				</div>
			) : filteredQuestions.length === 0 ? (
				<div className="text-center py-16">
					<FileQuestion className="w-12 h-12 text-gray-600 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-400">
						No questions found
					</h3>
					<p className="text-gray-500 text-sm">
						Add your first question to get started
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{Object.entries(groupedQuestions)
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
											<span className="text-cyan-400">{group.subjectCode}</span>
											<span className="text-gray-300">{group.subjectName}</span>
										</div>
									</div>
									<span className="text-gray-500 text-sm">
										{group.items.length} questions
									</span>
								</button>

								{expandedGroups.has(key) && (
									<div className="divide-y divide-white/5">
										{group.items.map((question) => (
											<div
												key={question.id}
												className="flex items-start justify-between p-4 hover:bg-white/[0.03]"
											>
												<div className="flex items-start gap-4">
													<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
														<FileQuestion className="w-5 h-5 text-cyan-400" />
													</div>
													<div>
														<p className="text-white">{question.text}</p>
														<div className="flex items-center gap-3 text-sm text-gray-500 mt-2 flex-wrap">
															<span className="badge-purple text-xs">
																{examTypeLabel(question.exam.examType)}
															</span>
															<span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs">
																{difficultyLabel(question.difficulty)}
															</span>
															<span>{question.marks} marks</span>
															{question.module && (
																<span className="text-amber-400">
																	Module {question.module.number}
																</span>
															)}
															{question.topic && (
																<span className="text-purple-400">
																	{question.topic.name}
																</span>
															)}
														</div>
													</div>
												</div>
												<button
													onClick={() => handleDelete(question.id)}
													disabled={isPending}
													className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
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
							className="bg-[#0f0f23] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
						>
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-xl font-semibold text-white">
									Add New Question
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
								{/* Course → Batch → Semester → Subject → Exam cascading */}
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
										Exam *
									</label>
									<select
										value={selectedExamId}
										onChange={(e) => setSelectedExamId(e.target.value)}
										className="select w-full"
										disabled={!selectedSubjectId}
										required
									>
										<option value="">Select Exam</option>
										{exams.map((e) => (
											<option key={e.id} value={e.id}>
												{examTypeLabel(e.examType)}
												{e.examDate &&
													` - ${new Date(e.examDate).toLocaleDateString()}`}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Question Text *
									</label>
									<textarea
										name="text"
										rows={3}
										required
										className="input w-full resize-none"
										placeholder="Enter the question..."
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Marks *
									</label>
									<input
										type="number"
										name="marks"
										min={1}
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
												Adding...
											</>
										) : (
											"Add Question"
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
