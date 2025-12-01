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
	Filter,
} from "lucide-react";
import {
	getQuestions,
	createQuestion,
	deleteQuestion,
	getDropdownData,
	getExams,
} from "../actions";

interface Question {
	id: string;
	text: string;
	marks: number;
	difficulty: string;
	bloomsLevel: string;
	questionNumber: string;
	exam: {
		id: string;
		examType: string;
		subjectOffering: {
			subject: {
				id: string;
				code: string;
				name: string;
			};
		};
	};
	topic: {
		id: string;
		name: string;
	} | null;
	module: {
		id: string;
		name: string;
		number: number;
	} | null;
}

interface DropdownData {
	subjects: any[];
	exams: any[];
	topics: any[];
	modules: any[];
	subjectOfferings: any[];
	semesters: any[];
}

export default function QuestionsPage() {
	const [questions, setQuestions] = useState<Question[]>([]);
	const [exams, setExams] = useState<any[]>([]);
	const [dropdownData, setDropdownData] = useState<DropdownData | null>(null);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterDifficulty, setFilterDifficulty] = useState<string>("");
	const [filterSubject, setFilterSubject] = useState<string>("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState("");

	useEffect(() => {
		fetchData();
	}, []);

	async function fetchData() {
		const [questionsResult, dropdownResult, examsResult] = await Promise.all([
			getQuestions(),
			getDropdownData(),
			getExams(),
		]);

		if (questionsResult.success && questionsResult.data) {
			setQuestions(questionsResult.data);
		}
		if (dropdownResult.success && dropdownResult.data) {
			setDropdownData(dropdownResult.data);
		}
		if (examsResult.success && examsResult.data) {
			setExams(examsResult.data);
		}
		setLoading(false);
	}

	const filteredQuestions = questions.filter((q) => {
		const matchesSearch = q.text
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesDifficulty =
			!filterDifficulty || q.difficulty === filterDifficulty;
		const matchesSubject =
			!filterSubject || q.exam?.subjectOffering?.subject?.id === filterSubject;
		return matchesSearch && matchesDifficulty && matchesSubject;
	});

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");

		const formData = new FormData(e.currentTarget);

		startTransition(async () => {
			const result = await createQuestion(formData);

			if (result.success) {
				setIsModalOpen(false);
				fetchData();
			} else {
				setError(result.error || "Something went wrong");
			}
		});
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

	const difficultyColors: Record<string, string> = {
		EASY: "bg-green-500/20 text-green-400 border-green-500/30",
		MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
		HARD: "bg-red-500/20 text-red-400 border-red-500/30",
	};

	const bloomsColors: Record<string, string> = {
		REMEMBER: "bg-blue-500/20 text-blue-400",
		UNDERSTAND: "bg-cyan-500/20 text-cyan-400",
		APPLY: "bg-green-500/20 text-green-400",
		ANALYZE: "bg-purple-500/20 text-purple-400",
		EVALUATE: "bg-pink-500/20 text-pink-400",
		CREATE: "bg-orange-500/20 text-orange-400",
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-white">Questions</h1>
					<p className="text-gray-400 text-sm">
						Manage exam questions in the database
					</p>
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
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
					<input
						type="text"
						placeholder="Search questions..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="input w-full pl-12"
					/>
				</div>

				<div className="flex gap-3">
					<select
						value={filterDifficulty}
						onChange={(e) => setFilterDifficulty(e.target.value)}
						className="input w-40"
					>
						<option value="">All Difficulty</option>
						<option value="EASY">Easy</option>
						<option value="MEDIUM">Medium</option>
						<option value="HARD">Hard</option>
					</select>

					<select
						value={filterSubject}
						onChange={(e) => setFilterSubject(e.target.value)}
						className="input w-48"
					>
						<option value="">All Subjects</option>
						{dropdownData?.subjects.map((s) => (
							<option key={s.id} value={s.id}>
								{s.code} - {s.name}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Questions List */}
			{loading ? (
				<div className="space-y-4">
					{[...Array(5)].map((_, i) => (
						<div
							key={i}
							className="h-28 bg-white/5 rounded-2xl animate-pulse"
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
						{searchQuery || filterDifficulty || filterSubject
							? "Try different filters"
							: "Add your first question to get started"}
					</p>
				</div>
			) : (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="space-y-4"
				>
					{filteredQuestions.map((question, index) => (
						<motion.div
							key={question.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.03 }}
							className="card card-hover p-5 group"
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1">
									<p className="text-white mb-3">{question.text}</p>

									<div className="flex flex-wrap items-center gap-2">
										<span className="badge-cyan text-xs">
											{question.exam?.subjectOffering?.subject?.code || "N/A"}
										</span>
										<span
											className={`badge text-xs border ${
												difficultyColors[question.difficulty]
											}`}
										>
											{question.difficulty}
										</span>
										<span
											className={`badge text-xs ${
												bloomsColors[question.bloomsLevel]
											}`}
										>
											{question.bloomsLevel}
										</span>
										<span className="text-gray-500 text-xs">
											{question.marks} marks
										</span>
										{question.topic && (
											<span className="text-gray-500 text-xs">
												• {question.topic.name}
											</span>
										)}
									</div>
								</div>

								<button
									onClick={() => handleDelete(question.id)}
									disabled={isPending}
									className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						</motion.div>
					))}
				</motion.div>
			)}

			{/* Add Question Modal */}
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
							className="bg-[#0f0f23] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto"
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
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Question Text *
									</label>
									<textarea
										name="text"
										placeholder="Enter the question..."
										required
										rows={4}
										className="input w-full resize-none"
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-300 mb-2">
											Marks *
										</label>
										<input
											type="number"
											name="marks"
											defaultValue={5}
											min={1}
											required
											className="input w-full"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-300 mb-2">
											Difficulty *
										</label>
										<select name="difficulty" required className="input w-full">
											<option value="EASY">Easy</option>
											<option value="MEDIUM">Medium</option>
											<option value="HARD">Hard</option>
										</select>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Bloom's Level *
									</label>
									<select name="bloomsLevel" required className="input w-full">
										<option value="REMEMBER">Remember</option>
										<option value="UNDERSTAND">Understand</option>
										<option value="APPLY">Apply</option>
										<option value="ANALYZE">Analyze</option>
										<option value="EVALUATE">Evaluate</option>
										<option value="CREATE">Create</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Exam *
									</label>
									<select name="examId" required className="input w-full">
										<option value="">Select an exam</option>
										{exams.map((exam) => (
											<option key={exam.id} value={exam.id}>
												{exam.subjectOffering?.subject?.code} -{" "}
												{exam.examType.replace("_", " ")} (
												{exam.examDate
													? new Date(exam.examDate).toLocaleDateString()
													: "No date"}
												)
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Topic (Optional)
									</label>
									<select name="topicId" className="input w-full">
										<option value="">Select a topic</option>
										{dropdownData?.topics.map((topic) => (
											<option key={topic.id} value={topic.id}>
												{topic.name}
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
