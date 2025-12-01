"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import {
	Send,
	Sparkles,
	BookOpen,
	GraduationCap,
	Lightbulb,
	ChevronDown,
	Loader2,
	Brain,
	Target,
	Copy,
	Check,
	RefreshCw,
	History,
	Menu,
	X,
	Star,
} from "lucide-react";
import {
	getSubjectsForUser,
	getExamTypes,
	generatePredictions,
	Subject,
	PredictionResult,
} from "./actions";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	predictions?: PredictionResult[];
	isTyping?: boolean;
}

const suggestedPrompts = [
	{
		icon: BookOpen,
		title: "Predict MT1 Questions",
		prompt: "Generate predicted questions for MT1 exam",
	},
	{
		icon: GraduationCap,
		title: "End Term Preparation",
		prompt: "What questions might appear in End Term exam?",
	},
	{
		icon: Lightbulb,
		title: "Topic-wise Analysis",
		prompt: "Analyze important topics for upcoming exam",
	},
	{
		icon: Target,
		title: "High Priority Questions",
		prompt: "Show me high-confidence predictions",
	},
];

export default function DashboardPage() {
	const { user, isLoaded } = useUser();
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [examTypes, setExamTypes] = useState<string[]>([]);
	const [selectedSubject, setSelectedSubject] = useState<string>("");
	const [selectedExamType, setSelectedExamType] = useState<string>("");
	const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
	const [showExamDropdown, setShowExamDropdown] = useState(false);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		loadInitialData();
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const loadInitialData = async () => {
		const [subjectsData, examTypesData] = await Promise.all([
			getSubjectsForUser(),
			getExamTypes(),
		]);
		setSubjects(subjectsData);
		setExamTypes(examTypesData);
		if (subjectsData.length > 0) {
			setSelectedSubject(subjectsData[0].id);
		}
		if (examTypesData.length > 0) {
			setSelectedExamType(examTypesData[0]);
		}
	};

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	const handleSubmit = async (customPrompt?: string) => {
		const prompt = customPrompt || input;
		if (!prompt.trim() || !selectedSubject || !selectedExamType) return;

		const userMessage: Message = {
			id: `user-${Date.now()}`,
			role: "user",
			content: prompt,
			timestamp: new Date(),
		};

		const loadingMessage: Message = {
			id: `loading-${Date.now()}`,
			role: "assistant",
			content: "",
			timestamp: new Date(),
			isTyping: true,
		};

		setMessages((prev) => [...prev, userMessage, loadingMessage]);
		setInput("");
		setIsLoading(true);

		try {
			// Generate predictions
			const predictions = await generatePredictions(
				selectedSubject,
				selectedExamType,
				10
			);

			const selectedSubjectName =
				subjects.find((s) => s.id === selectedSubject)?.name ||
				"Selected Subject";

			const assistantMessage: Message = {
				id: `assistant-${Date.now()}`,
				role: "assistant",
				content: `Based on the syllabus analysis and previous exam patterns for **${selectedSubjectName}** (${selectedExamType}), here are my predicted questions with confidence scores:`,
				timestamp: new Date(),
				predictions,
			};

			setMessages((prev) => [
				...prev.filter((m) => !m.isTyping),
				assistantMessage,
			]);
		} catch (error) {
			const errorMessage: Message = {
				id: `error-${Date.now()}`,
				role: "assistant",
				content:
					"I apologize, but I encountered an error while generating predictions. Please try again.",
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev.filter((m) => !m.isTyping), errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

	const copyToClipboard = (text: string, id: string) => {
		navigator.clipboard.writeText(text);
		setCopiedId(id);
		setTimeout(() => setCopiedId(null), 2000);
	};

	const getConfidenceColor = (confidence: number) => {
		if (confidence >= 80) return "text-green-400 bg-green-500/10";
		if (confidence >= 60) return "text-yellow-400 bg-yellow-500/10";
		return "text-orange-400 bg-orange-500/10";
	};

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case "Easy":
				return "text-green-400 border-green-400/30";
			case "Medium":
				return "text-yellow-400 border-yellow-400/30";
			case "Hard":
				return "text-red-400 border-red-400/30";
			default:
				return "text-gray-400 border-gray-400/30";
		}
	};

	if (!isLoaded) {
		return (
			<div className="min-h-screen bg-[#0f0f23] flex items-center justify-center">
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
				>
					<Sparkles className="h-8 w-8 text-purple-500" />
				</motion.div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#0f0f23] flex">
			{/* Mobile Sidebar Overlay */}
			<AnimatePresence>
				{sidebarOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
						onClick={() => setSidebarOpen(false)}
					/>
				)}
			</AnimatePresence>

			{/* Sidebar */}
			<motion.aside
				initial={false}
				animate={{
					x: sidebarOpen ? 0 : "-100%",
				}}
				className={`fixed md:relative md:translate-x-0 z-50 w-72 h-screen bg-[#0a0a1a] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out md:flex`}
			>
				{/* Sidebar Header */}
				<div className="p-4 border-b border-white/5">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="relative">
								<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
									<Sparkles className="h-5 w-5 text-white" />
								</div>
								<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a1a]" />
							</div>
							<div>
								<h1 className="text-lg font-bold text-white">Exam Predictor</h1>
								<p className="text-xs text-gray-500">AI-Powered</p>
							</div>
						</div>
						<button
							onClick={() => setSidebarOpen(false)}
							className="md:hidden p-2 text-gray-400 hover:text-white"
						>
							<X className="h-5 w-5" />
						</button>
					</div>
				</div>

				{/* New Chat Button */}
				<div className="p-4">
					<button
						onClick={() => setMessages([])}
						className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl text-white hover:from-purple-600/30 hover:to-pink-600/30 transition-all duration-300"
					>
						<RefreshCw className="h-4 w-4" />
						<span>New Prediction</span>
					</button>
				</div>

				{/* History Section */}
				<div className="flex-1 overflow-y-auto p-4">
					<div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-3">
						<History className="h-3 w-3" />
						<span>Recent Sessions</span>
					</div>
					<div className="space-y-2">
						{messages
							.filter((m) => m.role === "user")
							.slice(-5)
							.reverse()
							.map((msg) => (
								<button
									key={msg.id}
									className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-300 truncate"
								>
									{msg.content}
								</button>
							))}
						{messages.filter((m) => m.role === "user").length === 0 && (
							<p className="text-gray-600 text-sm text-center py-4">
								No predictions yet
							</p>
						)}
					</div>
				</div>

				{/* User Section */}
				<div className="p-4 border-t border-white/5">
					<div className="flex items-center gap-3">
						{user?.imageUrl ? (
							<img
								src={user.imageUrl}
								alt={user.fullName || "User"}
								className="w-10 h-10 rounded-full"
							/>
						) : (
							<div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
								{user?.firstName?.[0] || "U"}
							</div>
						)}
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-white truncate">
								{user?.fullName || "User"}
							</p>
							<p className="text-xs text-gray-500 truncate">
								{user?.primaryEmailAddress?.emailAddress}
							</p>
						</div>
					</div>
				</div>
			</motion.aside>

			{/* Main Content */}
			<main className="flex-1 flex flex-col h-screen overflow-hidden">
				{/* Top Bar */}
				<header className="flex items-center justify-between p-4 border-b border-white/5">
					<div className="flex items-center gap-4">
						<button
							onClick={() => setSidebarOpen(true)}
							className="md:hidden p-2 text-gray-400 hover:text-white"
						>
							<Menu className="h-5 w-5" />
						</button>

						{/* Subject Dropdown */}
						<div className="relative">
							<button
								onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
								className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
							>
								<BookOpen className="h-4 w-4 text-purple-400" />
								<span className="max-w-[150px] truncate">
									{subjects.find((s) => s.id === selectedSubject)?.name ||
										"Select Subject"}
								</span>
								<ChevronDown className="h-4 w-4" />
							</button>
							<AnimatePresence>
								{showSubjectDropdown && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										className="absolute top-full left-0 mt-2 w-64 max-h-80 overflow-y-auto bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-50"
									>
										{subjects.map((subject) => (
											<button
												key={subject.id}
												onClick={() => {
													setSelectedSubject(subject.id);
													setShowSubjectDropdown(false);
												}}
												className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors ${
													selectedSubject === subject.id
														? "bg-purple-600/20 text-purple-400"
														: "text-gray-300"
												}`}
											>
												<div className="font-medium">{subject.name}</div>
												<div className="text-xs text-gray-500">
													{subject.code}
												</div>
											</button>
										))}
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						{/* Exam Type Dropdown */}
						<div className="relative">
							<button
								onClick={() => setShowExamDropdown(!showExamDropdown)}
								className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
							>
								<GraduationCap className="h-4 w-4 text-pink-400" />
								<span>{selectedExamType || "Select Exam"}</span>
								<ChevronDown className="h-4 w-4" />
							</button>
							<AnimatePresence>
								{showExamDropdown && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-50"
									>
										{examTypes.map((type) => (
											<button
												key={type}
												onClick={() => {
													setSelectedExamType(type);
													setShowExamDropdown(false);
												}}
												className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors ${
													selectedExamType === type
														? "bg-purple-600/20 text-purple-400"
														: "text-gray-300"
												}`}
											>
												{type}
											</button>
										))}
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full">
							<Star className="h-4 w-4 text-yellow-500" />
							<span className="text-sm text-gray-300">Pro</span>
						</div>
					</div>
				</header>

				{/* Chat Area */}
				<div className="flex-1 overflow-y-auto">
					{messages.length === 0 ? (
						/* Welcome Screen */
						<div className="flex flex-col items-center justify-center h-full px-4 py-8">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5 }}
								className="text-center max-w-2xl"
							>
								<div className="relative inline-block mb-6">
									<div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center animate-pulse-ring">
										<Brain className="h-10 w-10 text-white" />
									</div>
								</div>

								<h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
									Hello,{" "}
									<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
										{user?.firstName || "there"}
									</span>
								</h1>

								<p className="text-gray-400 text-lg mb-8">
									I can help you predict exam questions based on your syllabus
									and previous exam patterns. Select a subject and exam type,
									then ask me anything!
								</p>

								{/* Suggested Prompts */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
									{suggestedPrompts.map((prompt, i) => (
										<motion.button
											key={i}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: i * 0.1 }}
											onClick={() => handleSubmit(prompt.prompt)}
											disabled={!selectedSubject || !selectedExamType}
											className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<div className="p-2 rounded-lg bg-purple-600/20 text-purple-400 group-hover:bg-purple-600/30 transition-colors">
												<prompt.icon className="h-5 w-5" />
											</div>
											<span className="text-sm text-gray-300 group-hover:text-white transition-colors">
												{prompt.title}
											</span>
										</motion.button>
									))}
								</div>
							</motion.div>
						</div>
					) : (
						/* Messages */
						<div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
							<AnimatePresence mode="popLayout">
								{messages.map((message) => (
									<motion.div
										key={message.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										className={`flex ${
											message.role === "user" ? "justify-end" : "justify-start"
										}`}
									>
										{message.role === "user" ? (
											/* User Message */
											<div className="max-w-[80%] bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl rounded-br-sm px-5 py-3">
												<p className="text-white">{message.content}</p>
											</div>
										) : message.isTyping ? (
											/* Typing Indicator */
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
													<Sparkles className="h-5 w-5 text-white" />
												</div>
												<div className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-2xl rounded-bl-sm">
													<Loader2 className="h-4 w-4 animate-spin text-purple-400" />
													<span className="text-gray-400">
														Analyzing syllabus and generating predictions...
													</span>
												</div>
											</div>
										) : (
											/* Assistant Message */
											<div className="flex gap-3 max-w-full w-full">
												<div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
													<Sparkles className="h-5 w-5 text-white" />
												</div>
												<div className="flex-1 space-y-4">
													<div className="bg-white/5 rounded-2xl rounded-bl-sm px-5 py-4">
														<p className="text-gray-200">{message.content}</p>
													</div>

													{/* Predictions */}
													{message.predictions &&
														message.predictions.length > 0 && (
															<div className="space-y-3">
																{message.predictions.map((prediction, idx) => (
																	<motion.div
																		key={prediction.id}
																		initial={{ opacity: 0, x: -20 }}
																		animate={{ opacity: 1, x: 0 }}
																		transition={{ delay: idx * 0.05 }}
																		className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all duration-300 group"
																	>
																		<div className="flex items-start justify-between gap-4 mb-3">
																			<div className="flex-1">
																				<div className="flex items-center gap-2 mb-2">
																					<span className="text-xs font-medium text-gray-500">
																						Q{idx + 1}
																					</span>
																					<span
																						className={`px-2 py-0.5 text-xs rounded-full ${getConfidenceColor(
																							prediction.confidence
																						)}`}
																					>
																						{prediction.confidence}% confidence
																					</span>
																				</div>
																				<p className="text-gray-200 font-medium">
																					{prediction.question}
																				</p>
																			</div>
																			<button
																				onClick={() =>
																					copyToClipboard(
																						prediction.question,
																						prediction.id
																					)
																				}
																				className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-white transition-all"
																			>
																				{copiedId === prediction.id ? (
																					<Check className="h-4 w-4 text-green-400" />
																				) : (
																					<Copy className="h-4 w-4" />
																				)}
																			</button>
																		</div>

																		<div className="flex flex-wrap gap-2">
																			<span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-lg">
																				{prediction.moduleName}
																			</span>
																			<span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg">
																				{prediction.topicName}
																			</span>
																			<span
																				className={`px-2 py-1 text-xs border rounded-lg ${getDifficultyColor(
																					prediction.difficulty
																				)}`}
																			>
																				{prediction.difficulty}
																			</span>
																			<span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded-lg">
																				{prediction.type} • {prediction.marks}{" "}
																				marks
																			</span>
																			<span className="px-2 py-1 text-xs bg-pink-500/20 text-pink-400 rounded-lg">
																				{prediction.bloomLevel}
																			</span>
																		</div>
																	</motion.div>
																))}
															</div>
														)}
												</div>
											</div>
										)}
									</motion.div>
								))}
							</AnimatePresence>
							<div ref={messagesEndRef} />
						</div>
					)}
				</div>

				{/* Input Area */}
				<div className="border-t border-white/5 p-4">
					<div className="max-w-4xl mx-auto">
						<div className="relative">
							<textarea
								ref={inputRef}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSubmit();
									}
								}}
								placeholder={
									selectedSubject && selectedExamType
										? "Ask me to predict exam questions..."
										: "Select a subject and exam type first..."
								}
								disabled={!selectedSubject || !selectedExamType || isLoading}
								rows={1}
								className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-14 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							/>
							<button
								onClick={() => handleSubmit()}
								disabled={
									!input.trim() ||
									!selectedSubject ||
									!selectedExamType ||
									isLoading
								}
								className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
							>
								{isLoading ? (
									<Loader2 className="h-5 w-5 animate-spin" />
								) : (
									<Send className="h-5 w-5" />
								)}
							</button>
						</div>
						<p className="text-center text-xs text-gray-600 mt-3">
							AI predictions are based on syllabus analysis and historical exam
							patterns. Results may vary.
						</p>
					</div>
				</div>
			</main>
		</div>
	);
}
