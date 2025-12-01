"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Sparkles,
	BookOpen,
	GraduationCap,
	ChevronDown,
	ChevronRight,
	Check,
	X,
	Loader2,
	Brain,
	Target,
	TrendingUp,
	FileQuestion,
	AlertCircle,
	Copy,
	CheckCircle,
	Minus,
} from "lucide-react";
import { getCourses, getBatches, getSemesters, getSubjects } from "../actions";

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

interface ModuleScope {
	moduleNumber: number;
	moduleName: string;
	included: boolean;
	excludedTopics: string[];
	topics: {
		name: string;
		included: boolean;
	}[];
}

interface PredictedQuestion {
	id: string;
	text: string;
	probability: number;
	module: string;
	topic: string;
	difficulty: "EASY" | "MEDIUM" | "HARD";
	questionType: "MCQ" | "SHORT" | "LONG" | "DESCRIPTIVE";
	marks: number;
	reasoning: string[];
	source: string;
}

interface PredictionResult {
	success: boolean;
	predictions: PredictedQuestion[];
	metadata: {
		subjectName: string;
		subjectCode: string;
		examType: string;
		totalPYQsAnalyzed: number;
		questionsByExamType?: {
			MIDTERM_1: number;
			MIDTERM_2: number;
			END_TERM: number;
		};
		modulesIncluded: string[];
		generatedAt: string;
		modelUsed: string;
		confidence: number;
	};
	error?: string;
}

export default function PredictPage() {
	// Data states
	const [courses, setCourses] = useState<Course[]>([]);
	const [batches, setBatches] = useState<Batch[]>([]);
	const [semesters, setSemesters] = useState<Semester[]>([]);
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [syllabusScope, setSyllabusScope] = useState<ModuleScope[]>([]);

	// Selection states
	const [selectedCourseId, setSelectedCourseId] = useState("");
	const [selectedBatchId, setSelectedBatchId] = useState("");
	const [selectedSemesterId, setSelectedSemesterId] = useState("");
	const [selectedSubjectId, setSelectedSubjectId] = useState("");
	const [examType, setExamType] = useState<string>("");
	const [questionCount, setQuestionCount] = useState(10);
	const [useThinkingModel, setUseThinkingModel] = useState(true);
	const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-pro");

	// UI states
	const [loading, setLoading] = useState(true);
	const [loadingScope, setLoadingScope] = useState(false);
	const [expandedModules, setExpandedModules] = useState<Set<number>>(
		new Set()
	);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState("");
	const [copiedId, setCopiedId] = useState<string | null>(null);

	// Results
	const [result, setResult] = useState<PredictionResult | null>(null);

	// Load courses on mount
	useEffect(() => {
		async function loadCourses() {
			try {
				const result = await getCourses();
				if (result.success && result.data) {
					setCourses(result.data);
				}
			} catch (err) {
				console.error("Failed to load courses:", err);
			} finally {
				setLoading(false);
			}
		}
		loadCourses();
	}, []);

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
			setSyllabusScope([]);
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
			setSyllabusScope([]);
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
			setSyllabusScope([]);
		}
		loadSubjects();
	}, [selectedSemesterId]);

	// Load syllabus scope when subject changes
	useEffect(() => {
		async function loadSyllabusScope() {
			if (!selectedSubjectId) {
				setSyllabusScope([]);
				return;
			}

			setLoadingScope(true);
			try {
				const response = await fetch(
					`/api/admin/predict?subjectId=${selectedSubjectId}`
				);
				const data = await response.json();

				if (data.success && data.scope) {
					setSyllabusScope(data.scope);
					// Expand all modules by default
					setExpandedModules(
						new Set(data.scope.map((m: ModuleScope) => m.moduleNumber))
					);
				} else {
					setSyllabusScope([]);
				}
			} catch (err) {
				console.error("Failed to load syllabus scope:", err);
				setSyllabusScope([]);
			} finally {
				setLoadingScope(false);
			}
		}
		loadSyllabusScope();
	}, [selectedSubjectId]);

	// Toggle module expansion
	function toggleModuleExpand(moduleNumber: number) {
		setExpandedModules((prev) => {
			const next = new Set(prev);
			if (next.has(moduleNumber)) {
				next.delete(moduleNumber);
			} else {
				next.add(moduleNumber);
			}
			return next;
		});
	}

	// Toggle module inclusion
	function toggleModuleInclusion(moduleNumber: number) {
		setSyllabusScope((prev) =>
			prev.map((m) =>
				m.moduleNumber === moduleNumber
					? {
							...m,
							included: !m.included,
							topics: m.topics.map((t) => ({
								...t,
								included: !m.included,
							})),
					  }
					: m
			)
		);
	}

	// Toggle topic inclusion
	function toggleTopicInclusion(moduleNumber: number, topicName: string) {
		setSyllabusScope((prev) =>
			prev.map((m) =>
				m.moduleNumber === moduleNumber
					? {
							...m,
							topics: m.topics.map((t) =>
								t.name === topicName ? { ...t, included: !t.included } : t
							),
					  }
					: m
			)
		);
	}

	// Generate predictions
	async function handlePredict() {
		setError("");
		setResult(null);

		if (!selectedSubjectId || !examType) {
			setError("Please select a subject and exam type");
			return;
		}

		const includedModules = syllabusScope.filter((m) => m.included);
		if (includedModules.length === 0) {
			setError("Please include at least one module in the syllabus scope");
			return;
		}

		startTransition(async () => {
			try {
				const response = await fetch("/api/admin/predict", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						subjectId: selectedSubjectId,
						examType,
						syllabusScope,
						questionCount,
						useThinkingModel,
						model: selectedModel,
					}),
				});
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || "Prediction failed");
				}

				setResult(data);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to generate predictions"
				);
			}
		});
	}

	// Copy question to clipboard
	function copyQuestion(question: PredictedQuestion) {
		const text = `Q. ${question.text}\n[${question.marks} marks - ${question.module}]`;
		navigator.clipboard.writeText(text);
		setCopiedId(question.id);
		setTimeout(() => setCopiedId(null), 2000);
	}

	// Get difficulty color
	function getDifficultyColor(diff: string) {
		switch (diff) {
			case "EASY":
				return "bg-green-500/20 text-green-400";
			case "MEDIUM":
				return "bg-yellow-500/20 text-yellow-400";
			case "HARD":
				return "bg-red-500/20 text-red-400";
			default:
				return "bg-gray-500/20 text-gray-400";
		}
	}

	// Get question type color
	function getTypeColor(type: string) {
		switch (type) {
			case "MCQ":
				return "bg-blue-500/20 text-blue-400";
			case "SHORT":
				return "bg-cyan-500/20 text-cyan-400";
			case "LONG":
				return "bg-purple-500/20 text-purple-400";
			case "DESCRIPTIVE":
				return "bg-pink-500/20 text-pink-400";
			default:
				return "bg-gray-500/20 text-gray-400";
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-white flex items-center gap-2">
						<Sparkles className="w-6 h-6 text-violet-400" />
						Predict Questions
					</h1>
					<p className="text-gray-400 text-sm">
						AI analyzes ALL PYQs, detects patterns, and predicts for your target
						exam
					</p>
				</div>
			</div>

			{/* How it Works */}
			<div className="card p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20">
				<h3 className="text-sm font-semibold text-violet-300 mb-2 flex items-center gap-2">
					<Brain className="w-4 h-4" />
					How Prediction Works
				</h3>
				<div className="grid sm:grid-cols-4 gap-4 text-xs text-gray-400">
					<div className="flex items-start gap-2">
						<span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
							1
						</span>
						<span>
							<strong className="text-white">Analyzes ALL PYQs</strong> -
							Midterm 1, Midterm 2, End Term questions
						</span>
					</div>
					<div className="flex items-start gap-2">
						<span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
							2
						</span>
						<span>
							<strong className="text-white">Detects Patterns</strong> - Topic
							frequency, repetitions, marks distribution
						</span>
					</div>
					<div className="flex items-start gap-2">
						<span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
							3
						</span>
						<span>
							<strong className="text-white">Scores Topics</strong> - Based on
							importance, freshness, exam coverage
						</span>
					</div>
					<div className="flex items-start gap-2">
						<span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
							4
						</span>
						<span>
							<strong className="text-white">Predicts for Target</strong> -
							Generates questions for selected exam type
						</span>
					</div>
				</div>
			</div>

			<div className="grid lg:grid-cols-2 gap-6">
				{/* Left Column: Configuration */}
				<div className="space-y-6">
					{/* Subject Selection */}
					<div className="card p-6 space-y-4">
						<h3 className="text-lg font-semibold text-white flex items-center gap-2">
							<GraduationCap className="w-5 h-5 text-violet-400" />
							Select Subject
						</h3>

						<div className="grid sm:grid-cols-2 gap-4">
							{/* Course */}
							<div className="space-y-2">
								<label className="text-sm text-gray-400">Course</label>
								<select
									value={selectedCourseId}
									onChange={(e) => setSelectedCourseId(e.target.value)}
									className="select w-full"
									disabled={loading}
								>
									<option value="">Select Course</option>
									{courses.map((c) => (
										<option key={c.id} value={c.id}>
											{c.code} - {c.name}
										</option>
									))}
								</select>
							</div>

							{/* Batch */}
							<div className="space-y-2">
								<label className="text-sm text-gray-400">Batch</label>
								<select
									value={selectedBatchId}
									onChange={(e) => setSelectedBatchId(e.target.value)}
									className="select w-full"
									disabled={!selectedCourseId}
								>
									<option value="">Select Batch</option>
									{batches.map((b) => (
										<option key={b.id} value={b.id}>
											{b.startYear} - {b.endYear}
										</option>
									))}
								</select>
							</div>

							{/* Semester */}
							<div className="space-y-2">
								<label className="text-sm text-gray-400">Semester</label>
								<select
									value={selectedSemesterId}
									onChange={(e) => setSelectedSemesterId(e.target.value)}
									className="select w-full"
									disabled={!selectedBatchId}
								>
									<option value="">Select Semester</option>
									{semesters.map((s) => (
										<option key={s.id} value={s.id}>
											Semester {s.number}
										</option>
									))}
								</select>
							</div>

							{/* Subject */}
							<div className="space-y-2">
								<label className="text-sm text-gray-400">Subject</label>
								<select
									value={selectedSubjectId}
									onChange={(e) => setSelectedSubjectId(e.target.value)}
									className="select w-full"
									disabled={!selectedSemesterId}
								>
									<option value="">Select Subject</option>
									{subjects.map((s) => (
										<option key={s.id} value={s.id}>
											{s.code} - {s.name}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>

					{/* Exam Settings */}
					<div className="card p-6 space-y-4">
						<h3 className="text-lg font-semibold text-white flex items-center gap-2">
							<FileQuestion className="w-5 h-5 text-cyan-400" />
							Exam Settings
						</h3>
						<div className="space-y-4">
							<div className="grid sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<label className="text-sm text-gray-400">Exam Type</label>
									<select
										value={examType}
										onChange={(e) => setExamType(e.target.value)}
										className="select w-full"
									>
										<option value="">Select Exam Type</option>
										<option value="MIDTERM_1">Midterm 1</option>
										<option value="MIDTERM_2">Midterm 2</option>
										<option value="END_TERM">End Term</option>
									</select>
								</div>

								<div className="space-y-2">
									<label className="text-sm text-gray-400">
										Questions to Generate
									</label>
									<input
										type="number"
										value={questionCount}
										onChange={(e) =>
											setQuestionCount(
												Math.max(1, parseInt(e.target.value) || 10)
											)
										}
										min={1}
										max={20}
										className="input w-full"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm text-gray-400 flex items-center gap-2">
									<Brain className="w-4 h-4 text-violet-400" />
									AI Model
								</label>
								<select
									value={selectedModel}
									onChange={(e) => setSelectedModel(e.target.value)}
									className="select w-full"
								>
									<option value="gemini-2.5-pro">
										Gemini 2.5 Pro (Recommended)
									</option>
									<option value="gemini-3-pro-preview">
										Gemini 3.0 Pro Preview (Limited)
									</option>
									<option value="gemini-2.5-flash">
										Gemini 2.5 Flash (Fast)
									</option>
									<option value="gemini-2.0-flash">
										Gemini 2.0 Flash (Legacy)
									</option>
								</select>
								{selectedModel === "gemini-3-pro-preview" && (
									<p className="text-xs text-amber-400 flex items-center gap-1.5 mt-1">
										<AlertCircle className="w-3 h-3" />
										Limited to ~30-50 requests/day on free tier
									</p>
								)}
								{selectedModel === "gemini-2.5-flash" && (
									<p className="text-xs text-gray-500 mt-1">
										Faster but may have lower quality reasoning
									</p>
								)}
								{selectedModel === "gemini-2.5-pro" && (
									<p className="text-xs text-gray-500 mt-1">
										Best balance of quality and speed
									</p>
								)}
							</div>
						</div>{" "}
						<div className="flex items-center gap-3 pt-2">
							<button
								onClick={() => setUseThinkingModel(!useThinkingModel)}
								className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
									useThinkingModel
										? "bg-violet-500/20 border border-violet-500/30 text-violet-300"
										: "bg-gray-800 border border-gray-700 text-gray-400"
								}`}
							>
								<Brain className="w-4 h-4" />
								<span className="text-sm">Use Advanced Reasoning</span>
								{useThinkingModel && <Check className="w-4 h-4" />}
							</button>
						</div>
					</div>

					{/* Syllabus Scope */}
					<div className="card p-6 space-y-4">
						<h3 className="text-lg font-semibold text-white flex items-center gap-2">
							<BookOpen className="w-5 h-5 text-pink-400" />
							Syllabus Scope
							<span className="text-sm font-normal text-gray-500">
								(Select modules & topics to include)
							</span>
						</h3>

						{loadingScope ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
								<span className="ml-2 text-gray-400">Loading syllabus...</span>
							</div>
						) : syllabusScope.length === 0 ? (
							<div className="text-center py-8">
								<BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
								<p className="text-gray-500">
									{selectedSubjectId
										? "No syllabus found. Please upload a syllabus first."
										: "Select a subject to load syllabus"}
								</p>
							</div>
						) : (
							<div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
								{syllabusScope.map((module) => (
									<div
										key={module.moduleNumber}
										className={`border rounded-xl overflow-hidden transition-colors ${
											module.included
												? "border-violet-500/30 bg-violet-500/5"
												: "border-gray-700 bg-gray-800/50"
										}`}
									>
										{/* Module Header */}
										<div className="flex items-center gap-3 p-3">
											<button
												onClick={() => toggleModuleExpand(module.moduleNumber)}
												className="p-1 hover:bg-white/10 rounded"
											>
												{expandedModules.has(module.moduleNumber) ? (
													<ChevronDown className="w-4 h-4 text-gray-400" />
												) : (
													<ChevronRight className="w-4 h-4 text-gray-400" />
												)}
											</button>

											<button
												onClick={() =>
													toggleModuleInclusion(module.moduleNumber)
												}
												className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
													module.included
														? "bg-violet-500 border-violet-500"
														: "border-gray-600 hover:border-gray-500"
												}`}
											>
												{module.included && (
													<Check className="w-3 h-3 text-white" />
												)}
											</button>

											<div className="flex-1">
												<span className="text-sm font-medium text-white">
													Module {module.moduleNumber}:
												</span>{" "}
												<span className="text-sm text-gray-300">
													{module.moduleName}
												</span>
											</div>

											<span className="text-xs text-gray-500">
												{module.topics.filter((t) => t.included).length}/
												{module.topics.length} topics
											</span>
										</div>

										{/* Topics */}
										{expandedModules.has(module.moduleNumber) && (
											<div className="border-t border-white/5 p-3 pl-12 space-y-2">
												{module.topics.map((topic) => (
													<button
														key={topic.name}
														onClick={() =>
															toggleTopicInclusion(
																module.moduleNumber,
																topic.name
															)
														}
														className="flex items-center gap-2 w-full text-left group"
													>
														<div
															className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
																topic.included
																	? "bg-cyan-500 border-cyan-500"
																	: "border-gray-600 group-hover:border-gray-500"
															}`}
														>
															{topic.included && (
																<Check className="w-2.5 h-2.5 text-white" />
															)}
														</div>
														<span
															className={`text-sm ${
																topic.included
																	? "text-gray-200"
																	: "text-gray-500"
															}`}
														>
															{topic.name}
														</span>
													</button>
												))}
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>

					{/* Error Message */}
					{error && (
						<div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
							<AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
							<p className="text-red-300 text-sm">{error}</p>
						</div>
					)}

					{/* Generate Button */}
					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						onClick={handlePredict}
						disabled={isPending || !selectedSubjectId || !examType}
						className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
					>
						{isPending ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" />
								Generating Predictions...
							</>
						) : (
							<>
								<Sparkles className="w-5 h-5" />
								Generate Predictions
							</>
						)}
					</motion.button>
				</div>

				{/* Right Column: Results */}
				<div className="space-y-6">
					{result ? (
						<>
							{/* Metadata Card */}
							<div className="card p-6">
								<div className="flex items-start justify-between mb-4">
									<div>
										<h3 className="text-lg font-semibold text-white">
											{result.metadata.subjectName}
										</h3>
										<p className="text-gray-400 text-sm">
											{result.metadata.subjectCode} • Predicting for{" "}
											<span className="text-violet-400 font-medium">
												{result.metadata.examType.replace("_", " ")}
											</span>
										</p>
									</div>
									<div className="text-right">
										<div className="text-2xl font-bold text-violet-400">
											{Math.round(result.metadata.confidence * 100)}%
										</div>
										<p className="text-gray-500 text-xs">Confidence</p>
									</div>
								</div>

								{/* PYQ Analysis Stats */}
								<div className="bg-white/5 rounded-xl p-4 mb-4">
									<h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
										<Target className="w-4 h-4 text-cyan-400" />
										Questions Analyzed
									</h4>
									<div className="grid grid-cols-4 gap-3">
										<div className="text-center">
											<p className="text-xl font-bold text-white">
												{result.metadata.totalPYQsAnalyzed}
											</p>
											<p className="text-gray-500 text-xs">Total</p>
										</div>
										{result.metadata.questionsByExamType && (
											<>
												<div className="text-center">
													<p className="text-lg font-semibold text-blue-400">
														{result.metadata.questionsByExamType.MIDTERM_1}
													</p>
													<p className="text-gray-500 text-xs">Mid 1</p>
												</div>
												<div className="text-center">
													<p className="text-lg font-semibold text-purple-400">
														{result.metadata.questionsByExamType.MIDTERM_2}
													</p>
													<p className="text-gray-500 text-xs">Mid 2</p>
												</div>
												<div className="text-center">
													<p className="text-lg font-semibold text-pink-400">
														{result.metadata.questionsByExamType.END_TERM}
													</p>
													<p className="text-gray-500 text-xs">End Term</p>
												</div>
											</>
										)}
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4 text-center">
									<div className="bg-violet-500/10 rounded-xl p-3">
										<FileQuestion className="w-5 h-5 text-violet-400 mx-auto mb-1" />
										<p className="text-white font-semibold">
											{result.predictions.length}
										</p>
										<p className="text-gray-500 text-xs">Predictions</p>
									</div>
									<div className="bg-pink-500/10 rounded-xl p-3">
										<Brain className="w-5 h-5 text-pink-400 mx-auto mb-1" />
										<p className="text-white font-semibold text-xs">
											{result.metadata.modelUsed
												.split("-")
												.slice(0, 2)
												.join("-")}
										</p>
										<p className="text-gray-500 text-xs">Model</p>
									</div>
								</div>
							</div>

							{/* Predictions List */}
							<div className="space-y-4">
								<h3 className="text-lg font-semibold text-white flex items-center gap-2">
									<TrendingUp className="w-5 h-5 text-green-400" />
									Predicted Questions
								</h3>

								<AnimatePresence>
									{result.predictions.map((q, index) => (
										<motion.div
											key={q.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1 }}
											className="card p-4 space-y-3"
										>
											{/* Question Header */}
											<div className="flex items-start justify-between gap-3">
												<div className="flex items-start gap-3">
													<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
														<span className="text-violet-400 text-sm font-semibold">
															{index + 1}
														</span>
													</div>
													<div>
														<p className="text-white">{q.text}</p>
														<div className="flex flex-wrap gap-2 mt-2">
															<span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
																{q.module}
															</span>
															<span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
																{q.topic}
															</span>
															<span
																className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(
																	q.difficulty
																)}`}
															>
																{q.difficulty}
															</span>
															<span
																className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(
																	q.questionType
																)}`}
															>
																{q.questionType}
															</span>
															<span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
																{q.marks} marks
															</span>
														</div>
													</div>
												</div>

												<div className="flex items-center gap-2">
													<div className="text-right">
														<p className="text-lg font-bold text-green-400">
															{Math.round(q.probability * 100)}%
														</p>
														<p className="text-gray-500 text-xs">Likely</p>
													</div>
													<button
														onClick={() => copyQuestion(q)}
														className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
													>
														{copiedId === q.id ? (
															<CheckCircle className="w-4 h-4 text-green-400" />
														) : (
															<Copy className="w-4 h-4" />
														)}
													</button>
												</div>
											</div>

											{/* Reasoning */}
											{q.reasoning.length > 0 && (
												<div className="bg-white/5 rounded-lg p-3">
													<p className="text-gray-500 text-xs mb-2">
														Why this question:
													</p>
													<ul className="space-y-1">
														{q.reasoning.map((reason, i) => (
															<li
																key={i}
																className="text-gray-400 text-sm flex items-start gap-2"
															>
																<Minus className="w-3 h-3 mt-1.5 flex-shrink-0" />
																{reason}
															</li>
														))}
													</ul>
												</div>
											)}
										</motion.div>
									))}
								</AnimatePresence>
							</div>
						</>
					) : (
						<div className="card p-8 text-center">
							<div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
								<Sparkles className="w-8 h-8 text-violet-400" />
							</div>
							<h3 className="text-lg font-semibold text-white mb-2">
								Ready to Predict
							</h3>
							<p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
								AI will analyze ALL questions from this subject (Midterm 1, 2,
								End Term) and predict likely questions for your selected exam.
							</p>

							{/* Quick Guide */}
							<div className="bg-white/5 rounded-xl p-4 text-left max-w-sm mx-auto">
								<h4 className="text-sm font-medium text-gray-300 mb-3">
									Quick Guide:
								</h4>
								<ul className="space-y-2 text-sm text-gray-400">
									<li className="flex items-start gap-2">
										<span className="text-violet-400">1.</span>
										Select your <strong className="text-white">Subject</strong>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-violet-400">2.</span>
										Choose <strong className="text-white">
											Target Exam
										</strong>{" "}
										(Mid 1, Mid 2, or End Term)
									</li>
									<li className="flex items-start gap-2">
										<span className="text-violet-400">3.</span>
										Configure{" "}
										<strong className="text-white">Syllabus Scope</strong> -
										enable/disable modules & topics
									</li>
									<li className="flex items-start gap-2">
										<span className="text-violet-400">4.</span>
										Click <strong className="text-white">Generate</strong> to
										get predictions
									</li>
								</ul>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
