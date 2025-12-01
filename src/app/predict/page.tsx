"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar, BottomNav, MobileHeader } from "@/components/layout";
import { Card, Button } from "@/components/ui";
import {
	Sparkles,
	Download,
	Target,
	BookOpen,
	FileText,
	BarChart3,
	Award,
	ChevronDown,
	ChevronUp,
	Loader2,
	Copy,
	Check,
	Share2,
	Printer,
	Settings,
	ChevronRight,
	GraduationCap,
	Minus,
	Filter,
	Menu,
	X,
	Edit3,
	Eye,
	Save,
	Undo,
	Redo,
} from "lucide-react";

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
	difficulty: string;
	marks: number;
	reasoning: string[];
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
	const [examType, setExamType] = useState("END_TERM");
	const [questionCount, setQuestionCount] = useState(10);

	// UI states
	const [loading, setLoading] = useState(true);
	const [loadingScope, setLoadingScope] = useState(false);
	const [expandedModules, setExpandedModules] = useState<Set<number>>(
		new Set()
	);
	const [predictions, setPredictions] = useState<PredictedQuestion[]>([]);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [canvasOpen, setCanvasOpen] = useState(false);
	const [headerCollapsed, setHeaderCollapsed] = useState(false);
	const [canvasContent, setCanvasContent] = useState("");
	const [headersVisible, setHeadersVisible] = useState(true);

	// Load courses on mount
	useEffect(() => {
		async function loadCourses() {
			try {
				const response = await fetch("/api/courses");
				const data = await response.json();
				if (data.success && data.data) {
					setCourses(data.data);
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
				const response = await fetch(
					`/api/batches?courseId=${selectedCourseId}`
				);
				const data = await response.json();
				if (data.success && data.data) {
					setBatches(data.data);
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
				const response = await fetch(
					`/api/semesters?batchId=${selectedBatchId}`
				);
				const data = await response.json();
				if (data.success && data.data) {
					setSemesters(data.data);
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
				const response = await fetch(
					`/api/subjects?semesterId=${selectedSemesterId}`
				);
				const data = await response.json();
				if (data.success && data.data) {
					setSubjects(data.data);
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
					`/api/syllabus-scope?subjectId=${selectedSubjectId}`
				);
				const data = await response.json();
				if (data.success && data.modules) {
					setSyllabusScope(data.modules);
				}
			} catch (err) {
				console.error("Failed to load syllabus scope:", err);
			} finally {
				setLoadingScope(false);
			}
		}
		loadSyllabusScope();
	}, [selectedSubjectId]);

	const toggleModule = (moduleNumber: number) => {
		setSyllabusScope((prev) =>
			prev.map((mod) =>
				mod.moduleNumber === moduleNumber
					? { ...mod, included: !mod.included }
					: mod
			)
		);
	};

	const toggleTopic = (moduleNumber: number, topicName: string) => {
		setSyllabusScope((prev) =>
			prev.map((mod) => {
				if (mod.moduleNumber === moduleNumber) {
					const updatedTopics = mod.topics.map((topic) =>
						topic.name === topicName
							? { ...topic, included: !topic.included }
							: topic
					);
					return { ...mod, topics: updatedTopics };
				}
				return mod;
			})
		);
	};

	const toggleModuleExpansion = (moduleNumber: number) => {
		setExpandedModules((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(moduleNumber)) {
				newSet.delete(moduleNumber);
			} else {
				newSet.add(moduleNumber);
			}
			return newSet;
		});
	};

	const generatePredictions = async () => {
		if (!selectedSubjectId) return;

		setLoading(true);
		setPredictions([]);

		try {
			const response = await fetch("/api/predict", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					subjectId: selectedSubjectId,
					examType: examType,
					questionCount: questionCount,
					syllabusScope: syllabusScope,
				}),
			});

			const data = await response.json();
			setPredictions(data.predictions || []);
		} catch (error) {
			console.error("Prediction failed:", error);
		} finally {
			setLoading(false);
		}
	};

	const downloadPDF = () => {
		if (predictions.length === 0) return;

		const subject = subjects.find((s) => s.id === selectedSubjectId);
		const content = `
PREDICTED EXAM QUESTIONS
${subject?.code} - ${subject?.name}
Exam Type: ${examType.replace("_", " ")}
Generated: ${new Date().toLocaleDateString()}
Total Questions: ${predictions.length}

${"=".repeat(80)}

${predictions
	.map(
		(pred, idx) => `
${idx + 1}. ${pred.text}
   Probability: ${Math.round(pred.probability * 100)}%
   Module: ${pred.module}
   Topic: ${pred.topic}
   Difficulty: ${pred.difficulty}
   Marks: ${pred.marks}
   
   Reasoning:
${pred.reasoning.map((r, i) => `   ${i + 1}. ${r}`).join("\n")}

${"─".repeat(80)}
`
	)
	.join("\n")}

Generated by AmityMate.ai - Powered by Gemini 3.0
`;

		const blob = new Blob([content], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `predicted-questions-${
			subject?.code
		}-${examType}-${Date.now()}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const copyToClipboard = (text: string, id: string) => {
		navigator.clipboard.writeText(text);
		setCopiedId(id);
		setTimeout(() => setCopiedId(null), 2000);
	};

	const copyAllQuestions = () => {
		const text = predictions.map((p, i) => `${i + 1}. ${p.text}`).join("\n\n");
		navigator.clipboard.writeText(text);
		setCopiedId("all");
		setTimeout(() => setCopiedId(null), 2000);
	};

	const printQuestions = () => {
		const printContent = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Predicted Questions - ${
		subjects.find((s) => s.id === selectedSubjectId)?.code || ""
	}</title>
	<style>
		body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
		h1 { color: #8b5cf6; border-bottom: 3px solid #8b5cf6; padding-bottom: 10px; }
		.meta { color: #666; margin: 20px 0; }
		.question { margin: 30px 0; padding: 20px; border-left: 4px solid #8b5cf6; background: #f9f9f9; }
		.question-number { font-weight: bold; color: #8b5cf6; font-size: 18px; }
		.question-text { margin: 10px 0; font-size: 16px; line-height: 1.6; }
		.details { display: flex; gap: 15px; margin: 10px 0; font-size: 14px; }
		.detail-item { padding: 5px 10px; background: #e9d5ff; border-radius: 5px; }
		.reasoning { margin-top: 15px; padding: 15px; background: white; border-radius: 5px; }
		.reasoning-title { font-weight: bold; margin-bottom: 10px; }
		.reasoning li { margin: 5px 0; }
		@media print { body { padding: 20px; } }
	</style>
</head>
<body>
	<h1>Predicted Exam Questions</h1>
	<div class="meta">
		<p><strong>Subject:</strong> ${
			subjects.find((s) => s.id === selectedSubjectId)?.code || ""
		} - ${subjects.find((s) => s.id === selectedSubjectId)?.name || ""}</p>
		<p><strong>Exam Type:</strong> ${examType.replace("_", " ")}</p>
		<p><strong>Total Questions:</strong> ${predictions.length}</p>
		<p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
	</div>
	${predictions
		.map(
			(pred, idx) => `
	<div class="question">
		<div class="question-number">Question ${idx + 1}</div>
		<div class="question-text">${pred.text}</div>
	</div>
	`
		)
		.join("")}
	<div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666;">
		<p>Generated by AmityMate.ai - Powered by Gemini 3.0</p>
	</div>
</body>
</html>
		`;

		const printWindow = window.open("", "_blank");
		if (printWindow) {
			printWindow.document.write(printContent);
			printWindow.document.close();
			printWindow.focus();
			setTimeout(() => {
				printWindow.print();
			}, 250);
		}
	};

	const toggleCanvas = () => {
		if (!canvasOpen) {
			// Format content for canvas
			const formatted = predictions
				.map(
					(pred, idx) =>
						`${idx + 1}. ${pred.text}\n\nProbability: ${Math.round(
							pred.probability * 100
						)}%\nModule: ${pred.module} | Topic: ${pred.topic}\nDifficulty: ${
							pred.difficulty
						} | Marks: ${pred.marks}\n\nReasoning:\n${pred.reasoning
							.map((r, i) => `  • ${r}`)
							.join("\n")}\n\n${"-".repeat(80)}\n`
				)
				.join("\n");
			setCanvasContent(formatted);
		}
		setCanvasOpen(!canvasOpen);
	};

	return (
		<div className="min-h-screen bg-background flex flex-col">
			{/* Header Visibility Toggle Button */}
			<button
				onClick={() => setHeadersVisible(!headersVisible)}
				className="fixed top-2 right-4 z-[100] p-2 bg-violet-600 rounded-lg shadow-lg hover:bg-violet-700 transition-colors"
				aria-label="Toggle headers"
				title={headersVisible ? "Hide header" : "Show header"}
			>
				{headersVisible ? (
					<ChevronUp className="w-4 h-4" />
				) : (
					<ChevronDown className="w-4 h-4" />
				)}
			</button>

			{headersVisible && (
				<>
					<Navbar />
					<MobileHeader title="Predict Questions" />
				</>
			)}

			{/* Mobile Sidebar Toggle */}
			<button
				onClick={() => setSidebarOpen(!sidebarOpen)}
				className={`lg:hidden fixed ${
					headersVisible ? "top-20" : "top-12"
				} left-4 z-50 p-3 bg-violet-600 rounded-full shadow-lg hover:bg-violet-700 transition-colors`}
				aria-label="Toggle sidebar"
			>
				{sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
			</button>

			{/* Mobile Overlay */}
			{sidebarOpen && (
				<div
					className="lg:hidden fixed inset-0 bg-black/50 z-20 top-16"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			<div
				className={`flex-1 flex ${headersVisible ? "pt-16 md:pt-20" : "pt-0"}`}
			>
				{/* Sidebar - Configuration */}
				<motion.aside
					initial={{ x: -300 }}
					animate={{ x: 0 }}
					transition={{ duration: 0.3 }}
					className={`
						fixed lg:sticky top-0 left-0 h-screen
						w-80 bg-[#1a1a2e] border-r border-white/10
						overflow-y-auto z-30 transition-transform duration-300
						${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
					`}
				>
					<div className="p-6">
						<div className="mb-6">
							<h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
								<Settings className="w-5 h-5 text-violet-400" />
								Configuration
							</h2>
							<p className="text-sm text-gray-400">
								Select your course and exam details
							</p>
						</div>

						<div className="space-y-5">
							{/* Course Selection */}
							<div>
								<label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
									<GraduationCap className="w-4 h-4" />
									Course
								</label>
								<select
									value={selectedCourseId}
									onChange={(e) => setSelectedCourseId(e.target.value)}
									className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
									disabled={loading}
								>
									<option value="" className="bg-gray-800">
										Select Course
									</option>
									{courses.map((c) => (
										<option key={c.id} value={c.id} className="bg-gray-800">
											{c.code} - {c.name}
										</option>
									))}
								</select>
							</div>

							{/* Batch Selection */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Batch
								</label>
								<select
									value={selectedBatchId}
									onChange={(e) => setSelectedBatchId(e.target.value)}
									className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
									disabled={!selectedCourseId || batches.length === 0}
								>
									<option value="" className="bg-gray-800">
										Select Batch
									</option>
									{batches.map((b) => (
										<option key={b.id} value={b.id} className="bg-gray-800">
											{b.startYear} - {b.endYear}
										</option>
									))}
								</select>
							</div>

							{/* Semester Selection */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Semester
								</label>
								<select
									value={selectedSemesterId}
									onChange={(e) => setSelectedSemesterId(e.target.value)}
									className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
									disabled={!selectedBatchId || semesters.length === 0}
								>
									<option value="" className="bg-gray-800">
										Select Semester
									</option>
									{semesters.map((s) => (
										<option key={s.id} value={s.id} className="bg-gray-800">
											Semester {s.number}
										</option>
									))}
								</select>
							</div>

							{/* Subject Selection */}
							<div>
								<label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
									<BookOpen className="w-4 h-4" />
									Subject
								</label>
								<select
									value={selectedSubjectId}
									onChange={(e) => setSelectedSubjectId(e.target.value)}
									className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
									disabled={!selectedSemesterId || subjects.length === 0}
								>
									<option value="" className="bg-gray-800">
										Select Subject
									</option>
									{subjects.map((s) => (
										<option key={s.id} value={s.id} className="bg-gray-800">
											{s.code} - {s.name}
										</option>
									))}
								</select>
							</div>

							{/* Syllabus Scope */}
							{selectedSubjectId && syllabusScope.length > 0 && (
								<div className="border-t border-white/10 pt-6">
									<label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
										<Filter className="w-4 h-4" />
										Syllabus Scope
									</label>
									<div className="space-y-2 max-h-64 overflow-y-auto">
										{syllabusScope.map((module) => (
											<div
												key={module.moduleNumber}
												className="bg-white/5 rounded-lg border border-white/10"
											>
												<div className="flex items-center gap-2 p-3">
													<button
														onClick={() => toggleModule(module.moduleNumber)}
														className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
															module.included
																? "bg-violet-500 border-violet-500"
																: "border-gray-500"
														}`}
													>
														{module.included && <Check className="w-3 h-3" />}
													</button>
													<button
														onClick={() =>
															toggleModuleExpansion(module.moduleNumber)
														}
														className="flex-1 flex items-center gap-2 text-left"
													>
														{expandedModules.has(module.moduleNumber) ? (
															<ChevronDown className="w-4 h-4 text-gray-400" />
														) : (
															<ChevronRight className="w-4 h-4 text-gray-400" />
														)}
														<span className="text-sm text-white">
															Module {module.moduleNumber}: {module.moduleName}
														</span>
													</button>
												</div>

												<AnimatePresence>
													{expandedModules.has(module.moduleNumber) && (
														<motion.div
															initial={{ height: 0, opacity: 0 }}
															animate={{ height: "auto", opacity: 1 }}
															exit={{ height: 0, opacity: 0 }}
															transition={{ duration: 0.2 }}
															className="overflow-hidden"
														>
															<div className="px-3 pb-3 space-y-1">
																{module.topics.map((topic) => (
																	<button
																		key={topic.name}
																		onClick={() =>
																			toggleTopic(
																				module.moduleNumber,
																				topic.name
																			)
																		}
																		className="w-full flex items-center gap-2 p-2 rounded hover:bg-white/5 transition-colors"
																	>
																		<div
																			className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
																				topic.included
																					? "bg-violet-500/50 border-violet-500"
																					: "border-gray-600"
																			}`}
																		>
																			{topic.included && (
																				<Minus className="w-3 h-3" />
																			)}
																		</div>
																		<span className="text-xs text-gray-300">
																			{topic.name}
																		</span>
																	</button>
																))}
															</div>
														</motion.div>
													)}
												</AnimatePresence>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Exam Type */}
							<div className="border-t border-white/10 pt-6">
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Exam Type
								</label>
								<select
									value={examType}
									onChange={(e) => setExamType(e.target.value)}
									className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
								>
									<option value="MIDTERM_1" className="bg-gray-800">
										Midterm 1
									</option>
									<option value="MIDTERM_2" className="bg-gray-800">
										Midterm 2
									</option>
									<option value="END_TERM" className="bg-gray-800">
										End Term
									</option>
								</select>
							</div>

							{/* Question Count */}
							<div>
								<label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-3">
									<span>Number of Questions</span>
									<span className="text-violet-400 font-bold text-lg">
										{questionCount}
									</span>
								</label>
								<input
									type="range"
									min="5"
									max="20"
									value={questionCount}
									onChange={(e) => setQuestionCount(parseInt(e.target.value))}
									className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
								/>
								<div className="flex justify-between text-xs text-gray-500 mt-1">
									<span>5</span>
									<span>20</span>
								</div>
							</div>

							{/* Generate Button */}
							<Button
								onClick={generatePredictions}
								disabled={!selectedSubjectId || loading}
								variant="primary"
								className="w-full py-3 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{loading ? (
									<>
										<Loader2 className="w-5 h-5 animate-spin" />
										Generating...
									</>
								) : (
									<>
										<Sparkles className="w-5 h-5" />
										Generate Predictions
									</>
								)}
							</Button>
						</div>

						{/* Legend */}
						<div className="mt-8 pt-6 border-t border-white/10">
							<h3 className="text-sm font-semibold text-gray-300 mb-3">
								Probability Legend
							</h3>
							<div className="space-y-2 text-sm">
								<div className="flex items-center gap-3 p-2 rounded-lg bg-red-500/10">
									<div className="w-3 h-3 rounded-full bg-red-500"></div>
									<span className="text-gray-300">High (70%+)</span>
								</div>
								<div className="flex items-center gap-3 p-2 rounded-lg bg-yellow-500/10">
									<div className="w-3 h-3 rounded-full bg-yellow-500"></div>
									<span className="text-gray-300">Medium (40-70%)</span>
								</div>
								<div className="flex items-center gap-3 p-2 rounded-lg bg-green-500/10">
									<div className="w-3 h-3 rounded-full bg-green-500"></div>
									<span className="text-gray-300">Low (&lt;40%)</span>
								</div>
							</div>
						</div>
					</div>
				</motion.aside>

				{/* Main Content Area */}
				<main
					className={`flex-1 overflow-y-auto p-4 md:p-8 ${
						headersVisible ? "pt-20 md:pt-24" : "pt-4 md:pt-8"
					}`}
				>
					<div className="max-w-5xl mx-auto">
						{predictions.length === 0 && !loading ? (
							<motion.div
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.5 }}
								className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-lg rounded-2xl p-12 md:p-16 border border-white/10 text-center"
							>
								<div className="bg-violet-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
									<Target className="w-10 h-10 text-violet-400" />
								</div>
								<h3 className="text-2xl font-bold text-white mb-3">
									No Predictions Yet
								</h3>
								<p className="text-gray-400 text-lg max-w-md mx-auto">
									Configure the settings and click "Generate Predictions" to see
									AI-powered question predictions
								</p>
							</motion.div>
						) : loading ? (
							<motion.div
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.5 }}
								className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-lg rounded-2xl p-12 md:p-16 border border-violet-500/20 text-center"
							>
								<div className="relative w-20 h-20 mx-auto mb-6">
									<div className="absolute inset-0 border-4 border-violet-500/30 rounded-full"></div>
									<div className="absolute inset-0 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
								</div>
								<h3 className="text-2xl font-bold text-white mb-3">
									Analyzing Patterns...
								</h3>
								<p className="text-gray-300 text-lg max-w-md mx-auto mb-4">
									Gemini 3.0 is processing historical data and generating
									predictions
								</p>
								<div className="flex items-center justify-center gap-2 text-sm text-violet-400">
									<span className="animate-pulse">●</span>
									<span className="animate-pulse animation-delay-200">●</span>
									<span className="animate-pulse animation-delay-400">●</span>
								</div>
							</motion.div>
						) : (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5 }}
								className="space-y-4"
							>
								{/* Export Actions Header */}
								<div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
									{/* Collapsible Header */}
									<button
										onClick={() => setHeaderCollapsed(!headerCollapsed)}
										className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
									>
										<div className="text-left">
											<h2 className="text-xl font-semibold text-white flex items-center gap-2">
												Predicted Questions
											</h2>
											<p className="text-sm text-gray-400 mt-1">
												{predictions.length} questions generated with AI
												analysis
											</p>
										</div>
										{headerCollapsed ? (
											<ChevronDown className="w-5 h-5 text-gray-400" />
										) : (
											<ChevronUp className="w-5 h-5 text-gray-400" />
										)}
									</button>

									{/* Action Buttons - Collapsible */}
									<AnimatePresence>
										{!headerCollapsed && (
											<motion.div
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: "auto", opacity: 1 }}
												exit={{ height: 0, opacity: 0 }}
												transition={{ duration: 0.2 }}
												className="border-t border-white/10"
											>
												<div className="p-4">
													<div className="flex items-center gap-2 flex-wrap">
														{/* Canvas Toggle */}
														<Button
															onClick={toggleCanvas}
															variant={canvasOpen ? "primary" : "secondary"}
															className="flex items-center gap-2 text-sm"
														>
															<Edit3 className="w-4 h-4" />
															<span className="hidden sm:inline">
																{canvasOpen ? "Close Canvas" : "Open Canvas"}
															</span>
														</Button>

														{/* Export Buttons */}
														<Button
															onClick={downloadPDF}
															variant="secondary"
															className="flex items-center gap-2 text-sm"
														>
															<Download className="w-4 h-4" />
															<span className="hidden sm:inline">Download</span>
														</Button>

														<Button
															onClick={copyAllQuestions}
															variant="secondary"
															className="flex items-center gap-2 text-sm"
														>
															{copiedId === "all" ? (
																<>
																	<Check className="w-4 h-4 text-green-500" />
																	<span className="hidden sm:inline">
																		Copied!
																	</span>
																</>
															) : (
																<>
																	<Copy className="w-4 h-4" />
																	<span className="hidden sm:inline">
																		Copy All
																	</span>
																</>
															)}
														</Button>

														<Button
															onClick={printQuestions}
															variant="secondary"
															className="flex items-center gap-2 text-sm"
														>
															<Printer className="w-4 h-4" />
															<span className="hidden sm:inline">Print</span>
														</Button>

														<Button
															onClick={() => {}}
															variant="ghost"
															className="flex items-center gap-2 text-sm"
														>
															<Share2 className="w-4 h-4" />
															<span className="hidden sm:inline">Share</span>
														</Button>
													</div>
												</div>
											</motion.div>
										)}
									</AnimatePresence>
								</div>

								{/* Questions List */}
								<div className="space-y-3 mt-4">
									{predictions.map((pred, index) => (
										<motion.div
											key={pred.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.3, delay: index * 0.05 }}
										>
											<PredictionCard
												prediction={pred}
												index={index + 1}
												onCopy={() => copyToClipboard(pred.text, pred.id)}
												isCopied={copiedId === pred.id}
											/>
										</motion.div>
									))}
								</div>
							</motion.div>
						)}
					</div>
				</main>

				{/* Canvas Panel - Gemini Style */}
				<AnimatePresence>
					{canvasOpen && (
						<>
							{/* Mobile Overlay */}
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								onClick={() => setCanvasOpen(false)}
								className="md:hidden fixed inset-0 bg-black/50 z-40"
							/>

							{/* Canvas Panel */}
							<motion.div
								initial={{ x: "100%" }}
								animate={{ x: 0 }}
								exit={{ x: "100%" }}
								transition={{ type: "spring", damping: 25, stiffness: 200 }}
								className="fixed md:sticky top-0 right-0 h-screen w-full md:w-[500px] lg:w-[600px] bg-[#1a1a2e] border-l border-white/10 z-50 md:z-auto flex flex-col"
							>
								{/* Canvas Header */}
								<div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-violet-500 rounded-lg flex items-center justify-center">
											<FileText className="w-5 h-5" />
										</div>
										<div>
											<h3 className="font-semibold text-white">
												Prediction Canvas
											</h3>
											<p className="text-xs text-gray-400">
												Edit and format your predictions
											</p>
										</div>
									</div>
									<button
										onClick={() => setCanvasOpen(false)}
										className="p-2 hover:bg-white/10 rounded-lg transition-colors"
									>
										<X className="w-5 h-5 text-gray-400" />
									</button>
								</div>

								{/* Canvas Toolbar */}
								<div className="p-3 border-b border-white/10 flex items-center gap-2 bg-white/5 flex-wrap">
									<Button
										onClick={() => {
											navigator.clipboard.writeText(canvasContent);
											setCopiedId("canvas");
											setTimeout(() => setCopiedId(null), 2000);
										}}
										variant="secondary"
										className="flex items-center gap-2 text-xs"
									>
										{copiedId === "canvas" ? (
											<>
												<Check className="w-3 h-3 text-green-500" />
												Copied!
											</>
										) : (
											<>
												<Copy className="w-3 h-3" />
												Copy All
											</>
										)}
									</Button>
									<Button
										onClick={downloadPDF}
										variant="secondary"
										className="flex items-center gap-2 text-xs"
									>
										<Download className="w-3 h-3" />
										Download
									</Button>
									<Button
										onClick={() => {
											// Insert divider
											setCanvasContent(
												(prev) => prev + "\n" + "=".repeat(80) + "\n\n"
											);
										}}
										variant="ghost"
										className="flex items-center gap-2 text-xs"
									>
										<Minus className="w-3 h-3" />
										Divider
									</Button>
								</div>

								{/* Canvas Content - Editable */}
								<div className="flex-1 overflow-y-auto p-4">
									<textarea
										value={canvasContent}
										onChange={(e) => setCanvasContent(e.target.value)}
										className="w-full h-full bg-white/5 border border-white/10 rounded-lg p-4 text-white font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
										placeholder="Your predictions will appear here..."
										spellCheck={false}
									/>
								</div>

								{/* Canvas Footer */}
								<div className="p-3 border-t border-white/10 bg-white/5 flex items-center justify-between text-xs text-gray-400">
									<span>{predictions.length} questions</span>
									<span>
										{canvasContent.split("\n").length} lines •{" "}
										{canvasContent.length} characters
									</span>
								</div>
							</motion.div>
						</>
					)}
				</AnimatePresence>
			</div>

			<BottomNav />
		</div>
	);
}

function PredictionCard({
	prediction,
	index,
	onCopy,
	isCopied,
}: {
	prediction: PredictedQuestion;
	index: number;
	onCopy?: () => void;
	isCopied?: boolean;
}) {
	const [expanded, setExpanded] = useState(false);

	const probabilityColor =
		prediction.probability >= 0.7
			? "border-red-500 bg-red-500/10"
			: prediction.probability >= 0.4
			? "border-yellow-500 bg-yellow-500/10"
			: "border-green-500 bg-green-500/10";

	const probabilityBg =
		prediction.probability >= 0.7
			? "bg-red-500"
			: prediction.probability >= 0.4
			? "bg-yellow-500"
			: "bg-green-500";

	return (
		<div
			className={`bg-white/10 backdrop-blur-lg rounded-xl p-5 border-l-4 ${probabilityColor} hover:bg-white/15 transition-all duration-300`}
		>
			<div className="flex items-start gap-4">
				<div
					className={`w-10 h-10 ${probabilityBg} rounded-full flex items-center justify-center font-bold shrink-0`}
				>
					{index}
				</div>

				<div className="flex-1">
					<div className="flex items-start justify-between gap-4">
						<p className="font-medium text-white leading-relaxed flex-1">
							{prediction.text}
						</p>

						<div className="flex items-center gap-3 shrink-0">
							{/* Copy Button */}
							{onCopy && (
								<button
									onClick={onCopy}
									className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
									title="Copy question"
								>
									{isCopied ? (
										<Check className="w-4 h-4 text-green-500" />
									) : (
										<Copy className="w-4 h-4 text-gray-400" />
									)}
								</button>
							)}

							{/* Probability Badge */}
							<div className="text-right">
								<span className="text-2xl font-bold">
									{Math.round(prediction.probability * 100)}%
								</span>
								<p className="text-xs text-gray-400">probability</p>
							</div>
						</div>
					</div>

					<div className="flex flex-wrap gap-2 mt-3">
						<span className="px-2 py-1 bg-violet-500/30 rounded text-xs flex items-center gap-1">
							<BookOpen className="w-3 h-3" /> {prediction.module}
						</span>
						<span className="px-2 py-1 bg-blue-500/30 rounded text-xs flex items-center gap-1">
							<FileText className="w-3 h-3" /> {prediction.topic}
						</span>
						<span className="px-2 py-1 bg-pink-500/30 rounded text-xs flex items-center gap-1">
							<BarChart3 className="w-3 h-3" /> {prediction.difficulty}
						</span>
						<span className="px-2 py-1 bg-green-500/30 rounded text-xs flex items-center gap-1">
							<Award className="w-3 h-3" /> {prediction.marks} marks
						</span>
					</div>

					<button
						onClick={() => setExpanded(!expanded)}
						className="text-violet-400 text-sm mt-3 hover:text-violet-300 flex items-center gap-1"
					>
						{expanded ? (
							<>
								<ChevronUp className="w-4 h-4" /> Hide reasoning
							</>
						) : (
							<>
								<ChevronDown className="w-4 h-4" /> Show reasoning
							</>
						)}
					</button>

					{expanded && (
						<div className="mt-3 p-3 bg-white/5 rounded-lg">
							<p className="text-sm text-gray-400 font-medium mb-2">
								Why this prediction:
							</p>
							<ul className="space-y-1">
								{prediction.reasoning.map((r, i) => (
									<li
										key={i}
										className="text-sm text-gray-300 flex items-start gap-2"
									>
										<span className="text-purple-400">•</span> {r}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
