"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar, BottomNav, MobileHeader } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
	Menu,
	Plus,
	MessageSquare,
	Send,
	Sparkles,
	Code,
	Lightbulb,
	Edit3,
	Trash2,
	Loader2,
	X,
	ChevronDown,
	ChevronUp,
} from "lucide-react";

interface Message {
	id: string;
	role: "user" | "model";
	text: string;
	createdAt: Date;
}

interface Conversation {
	id: string;
	title: string;
	updatedAt: Date;
}

const SUGGESTIONS = [
	{
		icon: <Sparkles className="w-5 h-5 text-violet-400" />,
		title: "Explain this topic from my syllabus",
		subtitle: "Get detailed explanations",
	},
	{
		icon: <Code className="w-5 h-5 text-purple-400" />,
		title: "Generate practice questions",
		subtitle: "Based on my subjects",
	},
	{
		icon: <Lightbulb className="w-5 h-5 text-yellow-400" />,
		title: "Study tips for upcoming exams",
		subtitle: "Personalized strategies",
	},
	{
		icon: <Edit3 className="w-5 h-5 text-green-400" />,
		title: "Help me understand complex concepts",
		subtitle: "Step by step explanations",
	},
];

export default function ChatPage() {
	const [isHeaderVisible, setIsHeaderVisible] = useState(true);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [activeConversationId, setActiveConversationId] = useState<
		string | null
	>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [inputText, setInputText] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [isLoadingConversations, setIsLoadingConversations] = useState(true);
	const [isLoadingMessages, setIsLoadingMessages] = useState(false);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		loadConversations();
	}, []);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const loadConversations = async () => {
		try {
			setIsLoadingConversations(true);
			const response = await fetch("/api/chat/conversations");
			if (response.ok) {
				const data = await response.json();
				setConversations(data);
			} else {
				// Fallback for when API is not ready
				console.warn("Chat API not ready, using empty state");
				setConversations([]);
			}
		} catch (error) {
			console.error("Failed to load conversations:", error);
			setConversations([]);
		} finally {
			setIsLoadingConversations(false);
		}
	};

	const loadConversation = async (conversationId: string) => {
		try {
			setIsLoadingMessages(true);
			const response = await fetch(`/api/chat/conversations/${conversationId}`);
			if (response.ok) {
				const data = await response.json();
				setMessages(
					data.messages.map((msg: any) => ({
						...msg,
						createdAt: new Date(msg.createdAt),
					}))
				);
				setActiveConversationId(conversationId);
			}
		} catch (error) {
			console.error("Failed to load conversation:", error);
		} finally {
			setIsLoadingMessages(false);
		}
	};

	const handleSend = async () => {
		if (!inputText.trim()) return;

		const userMessage: Message = {
			id: `temp-${Date.now()}`,
			role: "user",
			text: inputText,
			createdAt: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		const currentInput = inputText;
		setInputText("");
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}
		setIsTyping(true);

		try {
			// Create new conversation if none active
			let conversationId = activeConversationId;
			if (!conversationId) {
				const createResponse = await fetch("/api/chat/conversations", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						title: currentInput.slice(0, 50),
					}),
				});

				if (createResponse.ok) {
					const newConversation = await createResponse.json();
					conversationId = newConversation.id;
					setActiveConversationId(conversationId);
					await loadConversations();
				} else {
					throw new Error("Failed to create conversation");
				}
			}

			// Send message
			if (conversationId) {
				const response = await fetch(
					`/api/chat/conversations/${conversationId}/messages`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ message: currentInput }),
					}
				);

				if (response.ok) {
					const data = await response.json();
					const aiMessage: Message = {
						id: data.id,
						role: "model",
						text: data.response,
						createdAt: new Date(data.createdAt),
					};
					setMessages((prev) => [...prev, aiMessage]);
				} else {
					throw new Error("Failed to send message");
				}
			}
		} catch (error) {
			console.error("Failed to send message:", error);
			// Show error message in chat
			const errorMessage: Message = {
				id: `error-${Date.now()}`,
				role: "model",
				text: "Sorry, I couldn't process your message. The chat feature is being set up. Please try again later.",
				createdAt: new Date(),
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsTyping(false);
		}
	};

	const handleNewChat = () => {
		setMessages([]);
		setActiveConversationId(null);
	};

	const handleDeleteConversation = async (conversationId: string) => {
		if (!confirm("Delete this conversation?")) return;

		try {
			const response = await fetch(
				`/api/chat/conversations/${conversationId}`,
				{
					method: "DELETE",
				}
			);
			if (response.ok) {
				setConversations((prev) =>
					prev.filter((conv) => conv.id !== conversationId)
				);
				if (activeConversationId === conversationId) {
					handleNewChat();
				}
			}
		} catch (error) {
			console.error("Failed to delete conversation:", error);
		}
	};

	const handleSuggestionClick = (title: string) => {
		setInputText(title);
		textareaRef.current?.focus();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInputText(e.target.value);
		// Auto-resize textarea
		e.target.style.height = "auto";
		e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
	};

	return (
		<div className="min-h-screen bg-background text-white">
			{/* Header Toggle Button */}
			<button
				onClick={() => setIsHeaderVisible(!isHeaderVisible)}
				className="fixed top-4 right-4 z-[100] p-2 rounded-full bg-gray-800/80 backdrop-blur-sm border border-gray-700 hover:bg-gray-700 transition-colors"
				title={isHeaderVisible ? "Hide headers" : "Show headers"}
			>
				{isHeaderVisible ? (
					<ChevronUp className="w-5 h-5" />
				) : (
					<ChevronDown className="w-5 h-5" />
				)}
			</button>

			{/* Headers */}
			{isHeaderVisible && (
				<>
					<div className="hidden md:block">
						<Navbar />
					</div>
					<div className="md:hidden">
						<MobileHeader />
					</div>
				</>
			)}

			{/* Main Layout */}
			<div
				className={cn(
					"flex h-screen transition-all duration-300",
					isHeaderVisible ? "pt-16 md:pt-20" : "pt-0",
					"pb-16 md:pb-0"
				)}
			>
				{/* Sidebar */}
				<AnimatePresence>
					{isSidebarOpen && (
						<motion.aside
							initial={{ x: -300 }}
							animate={{ x: 0 }}
							exit={{ x: -300 }}
							transition={{ type: "spring", damping: 25 }}
							className="w-[280px] bg-gray-900/50 border-r border-gray-800 hidden md:flex flex-col"
						>
							{/* Sidebar Header */}
							<div className="p-4 border-b border-gray-800">
								<Button
									onClick={handleNewChat}
									variant="primary"
									className="w-full"
								>
									<Plus className="w-5 h-5 mr-2" />
									New Chat
								</Button>
							</div>

							{/* Conversations List */}
							<div className="flex-1 overflow-y-auto p-2 space-y-1">
								{isLoadingConversations ? (
									<div className="flex items-center justify-center py-8">
										<Loader2 className="w-6 h-6 animate-spin text-violet-500" />
									</div>
								) : conversations.length === 0 ? (
									<p className="text-center text-gray-500 py-8 text-sm">
										No conversations yet
									</p>
								) : (
									conversations.map((conv) => (
										<div
											key={conv.id}
											className={cn(
												"group relative p-3 rounded-lg cursor-pointer transition-colors",
												activeConversationId === conv.id
													? "bg-violet-500/20 text-white"
													: "hover:bg-gray-800/50 text-gray-300"
											)}
											onClick={() => loadConversation(conv.id)}
										>
											<div className="flex items-start gap-2">
												<MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
												<div className="flex-1 min-w-0">
													<p className="text-sm truncate">{conv.title}</p>
													<p className="text-xs text-gray-500 mt-0.5">
														{new Date(conv.updatedAt).toLocaleDateString()}
													</p>
												</div>
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleDeleteConversation(conv.id);
													}}
													className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-opacity"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										</div>
									))
								)}
							</div>

							{/* Sidebar Footer */}
							<div className="p-4 border-t border-gray-800">
								<button
									onClick={() => setIsSidebarOpen(false)}
									className="w-full p-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
								>
									<X className="w-4 h-4 mx-auto" />
								</button>
							</div>
						</motion.aside>
					)}
				</AnimatePresence>

				{/* Main Chat Area */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Sidebar Toggle (when closed) */}
					{!isSidebarOpen && (
						<button
							onClick={() => setIsSidebarOpen(true)}
							className="hidden md:block absolute top-24 left-4 p-2 rounded-full bg-gray-800/80 backdrop-blur-sm border border-gray-700 hover:bg-gray-700 transition-colors z-50"
						>
							<Menu className="w-5 h-5" />
						</button>
					)}

					{/* Messages Area */}
					<div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
						{messages.length === 0 ? (
							// Welcome Screen
							<div className="max-w-3xl mx-auto">
								<div className="text-center mb-8">
									<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 mb-4">
										<Sparkles className="w-8 h-8 text-white" />
									</div>
									<h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
										AmityMate AI Chat
									</h1>
									<p className="text-gray-400">
										Get help with your exam preparation
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{SUGGESTIONS.map((suggestion, index) => (
										<Card
											key={index}
											variant="glass"
											className="p-4 cursor-pointer hover:border-violet-500 transition-all group"
											onClick={() => handleSuggestionClick(suggestion.title)}
										>
											<div className="flex items-start gap-3">
												<div className="mt-1">{suggestion.icon}</div>
												<div>
													<h3 className="font-medium mb-1 group-hover:text-violet-400 transition-colors">
														{suggestion.title}
													</h3>
													<p className="text-sm text-gray-500">
														{suggestion.subtitle}
													</p>
												</div>
											</div>
										</Card>
									))}
								</div>
							</div>
						) : (
							// Messages
							<div className="max-w-3xl mx-auto space-y-6">
								{isLoadingMessages ? (
									<div className="flex items-center justify-center py-8">
										<Loader2 className="w-8 h-8 animate-spin text-violet-500" />
									</div>
								) : (
									messages.map((message) => (
										<div
											key={message.id}
											className={cn(
												"flex gap-4",
												message.role === "user"
													? "justify-end"
													: "justify-start"
											)}
										>
											{message.role === "model" && (
												<div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
													<Sparkles className="w-4 h-4 text-white" />
												</div>
											)}
											<div
												className={cn(
													"max-w-[80%] rounded-2xl px-4 py-3",
													message.role === "user"
														? "bg-violet-600 text-white ml-auto"
														: "bg-gray-800/50 text-gray-100"
												)}
											>
												<p className="whitespace-pre-wrap">{message.text}</p>
											</div>
											{message.role === "user" && (
												<div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
													You
												</div>
											)}
										</div>
									))
								)}

								{isTyping && (
									<div className="flex gap-4">
										<div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
											<Sparkles className="w-4 h-4 text-white" />
										</div>
										<div className="bg-gray-800/50 rounded-2xl px-4 py-3">
											<div className="flex gap-1">
												<div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></div>
												<div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
												<div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
											</div>
										</div>
									</div>
								)}

								<div ref={messagesEndRef} />
							</div>
						)}
					</div>

					{/* Input Area */}
					<div className="border-t border-gray-800 bg-background/80 backdrop-blur-sm p-4">
						<div className="max-w-3xl mx-auto">
							<div className="relative flex items-end gap-2 bg-gray-900/50 rounded-2xl border border-gray-800 focus-within:border-violet-500 transition-colors">
								<textarea
									ref={textareaRef}
									value={inputText}
									onChange={handleInputChange}
									onKeyDown={handleKeyDown}
									placeholder="Ask about your exams, subjects, or study tips..."
									rows={1}
									className="flex-1 bg-transparent text-white placeholder-gray-500 px-4 py-3 resize-none focus:outline-none max-h-[200px] overflow-y-auto"
								/>
								<button
									onClick={handleSend}
									disabled={!inputText.trim() || isTyping}
									className={cn(
										"m-2 p-2 rounded-full transition-all",
										inputText.trim() && !isTyping
											? "bg-violet-600 hover:bg-violet-500 text-white"
											: "bg-gray-800 text-gray-600 cursor-not-allowed"
									)}
								>
									{isTyping ? (
										<Loader2 className="w-5 h-5 animate-spin" />
									) : (
										<Send className="w-5 h-5" />
									)}
								</button>
							</div>
							<p className="text-xs text-gray-500 text-center mt-2">
								AI may display inaccurate info. Always verify exam-related
								responses.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Bottom Navigation (Mobile) */}
			<div className="md:hidden">
				<BottomNav />
			</div>
		</div>
	);
}
