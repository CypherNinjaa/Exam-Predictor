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
} from "lucide-react";
import { getExams, createExam, deleteExam, getDropdownData } from "../actions";

interface Exam {
	id: string;
	examType: string;
	examDate: Date | null;
	totalMarks: number;
	semester: {
		number: number;
		id: string;
	} | null;
	subjectOffering: {
		subject: {
			id: string;
			code: string;
			name: string;
		} | null;
	} | null;
	_count: {
		questions: number;
	};
}

interface DropdownData {
	subjects: any[];
	subjectOfferings: any[];
	semesters: any[];
}

export default function ExamsPage() {
	const [exams, setExams] = useState<Exam[]>([]);
	const [dropdownData, setDropdownData] = useState<DropdownData | null>(null);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterType, setFilterType] = useState<string>("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState("");

	useEffect(() => {
		fetchData();
	}, []);

	async function fetchData() {
		const [examsResult, dropdownResult] = await Promise.all([
			getExams(),
			getDropdownData(),
		]);

		if (examsResult.success && examsResult.data) {
			setExams(examsResult.data);
		}
		if (dropdownResult.success && dropdownResult.data) {
			setDropdownData(dropdownResult.data);
		}
		setLoading(false);
	}

	const filteredExams = exams.filter((e) => {
		const matchesSearch =
			e.subjectOffering?.subject?.name
				.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			e.subjectOffering?.subject?.code
				.toLowerCase()
				.includes(searchQuery.toLowerCase());
		const matchesType = !filterType || e.examType === filterType;
		return matchesSearch && matchesType;
	});

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");

		const formData = new FormData(e.currentTarget);

		startTransition(async () => {
			const result = await createExam(formData);

			if (result.success) {
				setIsModalOpen(false);
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

	const examTypeColors: Record<string, string> = {
		MT1: "from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400",
		MT2: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400",
		END_TERM:
			"from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400",
		QUIZ: "from-green-500/20 to-green-500/5 border-green-500/30 text-green-400",
		ASSIGNMENT:
			"from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400",
	};

	const examTypeLabels: Record<string, string> = {
		MT1: "Mid Term 1",
		MT2: "Mid Term 2",
		END_TERM: "End Term",
		QUIZ: "Quiz",
		ASSIGNMENT: "Assignment",
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-white">Exams</h1>
					<p className="text-gray-400 text-sm">
						Manage exam records and their questions
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
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
					<input
						type="text"
						placeholder="Search by subject..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="input w-full pl-12"
					/>
				</div>

				<select
					value={filterType}
					onChange={(e) => setFilterType(e.target.value)}
					className="input w-48"
				>
					<option value="">All Types</option>
					<option value="MT1">Mid Term 1</option>
					<option value="MT2">Mid Term 2</option>
					<option value="END_TERM">End Term</option>
					<option value="QUIZ">Quiz</option>
					<option value="ASSIGNMENT">Assignment</option>
				</select>
			</div>

			{/* Exams Grid */}
			{loading ? (
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{[...Array(6)].map((_, i) => (
						<div
							key={i}
							className="h-48 bg-white/5 rounded-2xl animate-pulse"
						/>
					))}
				</div>
			) : filteredExams.length === 0 ? (
				<div className="text-center py-16">
					<GraduationCap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-400">No exams found</h3>
					<p className="text-gray-500 text-sm">
						{searchQuery || filterType
							? "Try different filters"
							: "Add your first exam to get started"}
					</p>
				</div>
			) : (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
				>
					{filteredExams.map((exam, index) => (
						<motion.div
							key={exam.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.05 }}
							className="card card-hover p-5 group"
						>
							<div className="flex items-start justify-between mb-4">
								<div
									className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${
										examTypeColors[exam.examType] || examTypeColors.END_TERM
									} border text-sm font-medium`}
								>
									{examTypeLabels[exam.examType] || exam.examType}
								</div>

								<button
									onClick={() => handleDelete(exam.id)}
									disabled={isPending}
									className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>

							<h3 className="font-semibold text-white text-lg mb-1">
								{exam.subjectOffering?.subject?.name || "Unknown Subject"}
							</h3>
							<p className="text-amber-400 text-sm font-medium mb-4">
								{exam.subjectOffering?.subject?.code}
							</p>

							<div className="space-y-2 text-sm text-gray-400">
								<div className="flex items-center gap-2">
									<Calendar className="w-4 h-4" />
									{exam.examDate
										? new Date(exam.examDate).toLocaleDateString("en-US", {
												year: "numeric",
												month: "long",
												day: "numeric",
										  })
										: "Date not set"}
								</div>
								<div className="flex items-center gap-2">
									<FileQuestion className="w-4 h-4" />
									{exam._count.questions} questions • {exam.totalMarks} marks
								</div>
							</div>

							<div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5 text-xs text-gray-500">
								<span>Semester {exam.semester?.number}</span>
							</div>
						</motion.div>
					))}
				</motion.div>
			)}

			{/* Add Exam Modal */}
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
										Subject Offering *
									</label>
									<select
										name="subjectOfferingId"
										required
										className="input w-full"
									>
										<option value="">Select a subject offering</option>
										{dropdownData?.subjectOfferings?.map((so: any) => (
											<option key={so.id} value={so.id}>
												{so.subject?.code} - {so.subject?.name} (Sem{" "}
												{so.semester?.number})
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Exam Type *
									</label>
									<select name="type" required className="input w-full">
										<option value="MT1">Mid Term 1</option>
										<option value="MT2">Mid Term 2</option>
										<option value="END_TERM">End Term</option>
										<option value="QUIZ">Quiz</option>
										<option value="ASSIGNMENT">Assignment</option>
									</select>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-300 mb-2">
											Date *
										</label>
										<input
											type="date"
											name="date"
											required
											className="input w-full"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-300 mb-2">
											Total Marks *
										</label>
										<input
											type="number"
											name="totalMarks"
											defaultValue={100}
											min={1}
											required
											className="input w-full"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Semester *
									</label>
									<select name="semesterId" required className="input w-full">
										<option value="">Select semester</option>
										{dropdownData?.semesters?.map((s: any) => (
											<option key={s.id} value={s.id}>
												Semester {s.number} ({s.academicYear?.startYear}-
												{s.academicYear?.endYear})
											</option>
										))}
									</select>
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
