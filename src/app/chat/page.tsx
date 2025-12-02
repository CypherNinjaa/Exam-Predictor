"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar, BottomNav, MobileHeader } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import MemoryManager from "@/components/memory/MemoryManager";
import ReactMarkdown from "react-markdown";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";
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
	ChevronLeft,
	Copy,
	Check,
	RotateCw,
	ThumbsUp,
	ThumbsDown,
	Share2,
	MoreVertical,
	Pencil,
	Settings,
	Brain,
	Image as ImageIcon,
	Video,
	Download,
	Maximize2,
} from "lucide-react";

type ChatMode = "text" | "image" | "video";
type ImageModel = "imagen" | "nano";
type VideoModel = "fast" | "hq";
type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
type Resolution = "720p" | "1080p";

interface Message {
	id: string;
	role: "user" | "model";
	text: string;
	mediaType?: "TEXT" | "IMAGE" | "VIDEO";
	imageUrl?: string;
	videoUrl?: string;
	mimeType?: string;
	metadata?: any;
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
	const { user } = useUser();
	const [isHeaderVisible, setIsHeaderVisible] = useState(true);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [activeConversationId, setActiveConversationId] = useState<
		string | null
	>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [inputText, setInputText] = useState("");
	const [promptHistory, setPromptHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [isTyping, setIsTyping] = useState(false);
	const [isLoadingConversations, setIsLoadingConversations] = useState(true);
	const [isLoadingMessages, setIsLoadingMessages] = useState(false);
	const [selectedModel, setSelectedModel] = useState<"fast" | "advanced">(
		"fast"
	);
	const [copiedCode, setCopiedCode] = useState<string | null>(null);
	const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
	const [editingConversation, setEditingConversation] = useState<string | null>(
		null
	);
	const [editTitle, setEditTitle] = useState("");
	const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [chatWidth, setChatWidth] = useState<"narrow" | "wide" | "full">(
		"narrow"
	);

	// Multimodal state
	const [chatMode, setChatMode] = useState<ChatMode>("text");
	const [imageModel, setImageModel] = useState<ImageModel>("imagen");
	const [videoModel, setVideoModel] = useState<VideoModel>("fast");
	const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
	const [resolution, setResolution] = useState<Resolution>("720p");
	const [isGenerating, setIsGenerating] = useState(false);
	const [referenceImage, setReferenceImage] = useState<string | null>(null);
	const [lightboxImage, setLightboxImage] = useState<string | null>(null);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

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

		// Route to appropriate handler based on chat mode
		if (chatMode === "image") {
			await handleImageGeneration();
		} else if (chatMode === "video") {
			await handleVideoGeneration();
		} else {
			await handleTextChat();
		}
	};

	const handleTextChat = async () => {
		if (!inputText.trim()) return;

		const userMessage: Message = {
			id: `temp-${Date.now()}`,
			role: "user",
			text: inputText,
			mediaType: "TEXT",
			createdAt: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		const currentInput = inputText;

		// Add to prompt history
		setPromptHistory((prev) => [currentInput, ...prev].slice(0, 50)); // Keep last 50 prompts
		setHistoryIndex(-1);

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
						modelUsed: selectedModel,
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

			// Send message with streaming
			if (conversationId) {
				const response = await fetch(
					`/api/chat/conversations/${conversationId}/messages`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ message: currentInput }),
					}
				);

				if (!response.ok) {
					throw new Error("Failed to send message");
				}

				// Handle streaming response
				const reader = response.body?.getReader();
				const decoder = new TextDecoder();
				let streamedText = "";

				// Create initial AI message
				const aiMessageId = `ai-${Date.now()}`;
				const aiMessage: Message = {
					id: aiMessageId,
					role: "model",
					text: "",
					createdAt: new Date(),
				};
				setMessages((prev) => [...prev, aiMessage]);

				if (reader) {
					try {
						while (true) {
							const { done, value } = await reader.read();
							if (done) break;

							const chunk = decoder.decode(value, { stream: true });
							const lines = chunk.split("\n");

							for (const line of lines) {
								if (line.startsWith("data: ")) {
									const data = line.slice(6);
									if (data === "[DONE]") {
										setIsTyping(false);
										break;
									}

									try {
										const parsed = JSON.parse(data);
										if (parsed.text) {
											streamedText += parsed.text;
											// Update message with streamed text
											setMessages((prev) =>
												prev.map((msg) =>
													msg.id === aiMessageId
														? { ...msg, text: streamedText }
														: msg
												)
											);
										}
									} catch (e) {
										// Ignore JSON parse errors
									}
								}
							}
						}
					} catch (streamError) {
						console.error("Stream reading error:", streamError);
					}
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

	const handleImageGeneration = async () => {
		if (!inputText.trim()) return;

		setIsGenerating(true);
		const currentInput = inputText;
		const currentRefImage = referenceImage;
		setInputText("");

		try {
			// Create conversation if needed
			let conversationId = activeConversationId;
			if (!conversationId) {
				const createResponse = await fetch("/api/chat/conversations", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						title: `Image: ${currentInput.slice(0, 40)}`,
						modelUsed: imageModel,
					}),
				});

				if (createResponse.ok) {
					const newConversation = await createResponse.json();
					conversationId = newConversation.id;
					setActiveConversationId(conversationId);
					await loadConversations();
				}
			}

			// Show user message with reference image preview
			if (currentRefImage) {
				const userMessage: Message = {
					id: `user-${Date.now()}`,
					role: "user",
					text: currentInput,
					mediaType: "TEXT",
					imageUrl: `data:image/jpeg;base64,${currentRefImage}`,
					createdAt: new Date(),
				};
				setMessages((prev) => [...prev, userMessage]);
			}

			// Show generating message
			const generatingMessage: Message = {
				id: `generating-${Date.now()}`,
				role: "model",
				text:
					imageModel === "imagen"
						? "🎨 Generating with Imagen 4.0..."
						: "✨ Generating with Nano Banana...",
				mediaType: "TEXT",
				createdAt: new Date(),
			};
			setMessages((prev) => [...prev, generatingMessage]);

			// Generate image
			const response = await fetch("/api/chat/generate-image", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					conversationId,
					prompt: currentInput,
					model: imageModel,
					aspectRatio,
					editImage: currentRefImage,
					mimeType: "image/jpeg",
				}),
			});

			const data = await response.json();

			// Remove temporary messages
			setMessages((prev) =>
				prev.filter(
					(msg) =>
						!msg.id.startsWith("user-") && !msg.id.startsWith("generating-")
				)
			);

			if (response.ok && data.success) {
				// Refresh conversation to show new messages from DB
				if (conversationId) {
					await loadConversation(conversationId);
				}
				// Clear reference image after generation
				setReferenceImage(null);
			} else {
				throw new Error(data.error || "Image generation failed");
			}
		} catch (error) {
			console.error("Image generation error:", error);
			const errorMessage: Message = {
				id: `error-${Date.now()}`,
				role: "model",
				text: "❌ Sorry, image generation failed. Please try again.",
				mediaType: "TEXT",
				createdAt: new Date(),
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleVideoGeneration = async () => {
		if (!inputText.trim()) return;

		setIsGenerating(true);
		const currentInput = inputText;
		const currentRefImage = referenceImage;
		setInputText("");

		try {
			// Create conversation if needed
			let conversationId = activeConversationId;
			if (!conversationId) {
				const createResponse = await fetch("/api/chat/conversations", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						title: `Video: ${currentInput.slice(0, 40)}`,
						modelUsed: videoModel,
					}),
				});

				if (createResponse.ok) {
					const newConversation = await createResponse.json();
					conversationId = newConversation.id;
					setActiveConversationId(conversationId);
					await loadConversations();
				}
			}

			// Show user message with reference image preview
			const userMessage: Message = {
				id: `user-${Date.now()}`,
				role: "user",
				text: currentInput,
				mediaType: "TEXT",
				imageUrl: currentRefImage
					? `data:image/jpeg;base64,${currentRefImage}`
					: undefined,
				createdAt: new Date(),
			};
			setMessages((prev) => [...prev, userMessage]);

			// Show "generating" message
			const generatingMessage: Message = {
				id: `generating-${Date.now()}`,
				role: "model",
				text: "🎬 Generating video... This may take a few minutes.",
				mediaType: "TEXT",
				createdAt: new Date(),
			};
			setMessages((prev) => [...prev, generatingMessage]);

			// Generate video
			const response = await fetch("/api/chat/generate-video", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					conversationId,
					prompt: currentInput,
					model: videoModel,
					aspectRatio,
					resolution,
					referenceImage: currentRefImage
						? { base64: currentRefImage, mimeType: "image/jpeg" }
						: undefined,
				}),
			});

			const data = await response.json();

			// Remove temporary messages (user and generating)
			setMessages((prev) =>
				prev.filter(
					(msg) => msg.id !== userMessage.id && msg.id !== generatingMessage.id
				)
			);

			if (response.ok && data.success) {
				// Refresh conversation to show new messages from DB
				if (conversationId) {
					await loadConversation(conversationId);
				}
				// Clear reference image after generation
				setReferenceImage(null);
			} else {
				throw new Error(data.error || "Video generation failed");
			}
		} catch (error) {
			console.error("Video generation error:", error);
			const errorMessage: Message = {
				id: `error-${Date.now()}`,
				role: "model",
				text: "❌ Sorry, video generation failed. Please try again.",
				mediaType: "TEXT",
				createdAt: new Date(),
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Convert to base64
		const reader = new FileReader();
		reader.onload = () => {
			const base64 = reader.result?.toString().split(",")[1];
			if (base64) {
				setReferenceImage(base64);
			}
		};
		reader.readAsDataURL(file);
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
		const items = e.clipboardData?.items;
		if (!items) return;

		for (let i = 0; i < items.length; i++) {
			if (items[i].type.indexOf("image") !== -1) {
				e.preventDefault();
				const file = items[i].getAsFile();
				if (file) {
					const reader = new FileReader();
					reader.onload = () => {
						const base64 = reader.result?.toString().split(",")[1];
						if (base64) {
							setReferenceImage(base64);
							// Switch to appropriate mode if not already
							if (chatMode === "text") {
								setChatMode("image");
								setImageModel("nano");
							}
						}
					};
					reader.readAsDataURL(file);
				}
				break;
			}
		}
	};

	const handleNewChat = () => {
		setMessages([]);
		setActiveConversationId(null);
		setReferenceImage(null);
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

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		} else if (e.key === "ArrowUp") {
			// Navigate to previous prompt (like GitHub Copilot)
			console.log(
				"ArrowUp pressed, history length:",
				promptHistory.length,
				"current index:",
				historyIndex
			);
			if (promptHistory.length > 0) {
				e.preventDefault();
				const newIndex = Math.min(historyIndex + 1, promptHistory.length - 1);
				console.log("Loading history at index:", newIndex);
				setHistoryIndex(newIndex);
				const historyText = promptHistory[newIndex];
				console.log("History text:", historyText);
				setInputText(historyText);
				// Move cursor to end after state updates
				requestAnimationFrame(() => {
					if (textareaRef.current) {
						textareaRef.current.selectionStart = historyText.length;
						textareaRef.current.selectionEnd = historyText.length;
						// Trigger resize
						textareaRef.current.style.height = "auto";
						textareaRef.current.style.height = `${Math.min(
							textareaRef.current.scrollHeight,
							200
						)}px`;
					}
				});
			}
		} else if (e.key === "ArrowDown") {
			// Navigate to next prompt
			if (historyIndex >= 0) {
				e.preventDefault();
				if (historyIndex > 0) {
					const newIndex = historyIndex - 1;
					setHistoryIndex(newIndex);
					const historyText = promptHistory[newIndex];
					setInputText(historyText);
					requestAnimationFrame(() => {
						if (textareaRef.current) {
							textareaRef.current.selectionStart = historyText.length;
							textareaRef.current.selectionEnd = historyText.length;
							textareaRef.current.style.height = "auto";
							textareaRef.current.style.height = `${Math.min(
								textareaRef.current.scrollHeight,
								200
							)}px`;
						}
					});
				} else if (historyIndex === 0) {
					// Go back to empty input
					setHistoryIndex(-1);
					setInputText("");
					requestAnimationFrame(() => {
						if (textareaRef.current) {
							textareaRef.current.style.height = "auto";
						}
					});
				}
			}
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInputText(e.target.value);
		// Reset history navigation when user types
		if (historyIndex !== -1) {
			setHistoryIndex(-1);
		}
		// Auto-resize textarea
		e.target.style.height = "auto";
		e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
	};

	const copyToClipboard = async (text: string, id: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedCode(id);
			setTimeout(() => setCopiedCode(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const copyMessage = async (text: string, id: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedMessage(id);
			setTimeout(() => setCopiedMessage(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const handleRegenerateResponse = async () => {
		if (messages.length < 2) return;
		const lastUserMessage = messages
			.slice()
			.reverse()
			.find((m) => m.role === "user");
		if (lastUserMessage) {
			// Remove last AI response
			setMessages((prev) =>
				prev.filter(
					(m) => m.role !== "model" || m.id !== messages[messages.length - 1].id
				)
			);
			// Resend
			setInputText(lastUserMessage.text);
			setTimeout(() => handleSend(), 100);
		}
	};

	const handleRenameConversation = async (convId: string, newTitle: string) => {
		try {
			const response = await fetch(`/api/chat/conversations/${convId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title: newTitle }),
			});
			if (response.ok) {
				setConversations((prev) =>
					prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
				);
				setEditingConversation(null);
			}
		} catch (error) {
			console.error("Failed to rename conversation:", error);
		}
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

			{/* Width Toggle Button */}
			<button
				onClick={() => {
					setChatWidth((prev) =>
						prev === "narrow" ? "wide" : prev === "wide" ? "full" : "narrow"
					);
				}}
				className="fixed top-4 right-16 z-[100] p-2 rounded-full bg-gray-800/80 backdrop-blur-sm border border-gray-700 hover:bg-gray-700 transition-colors"
				title={`Chat width: ${
					chatWidth === "narrow"
						? "Narrow (3xl)"
						: chatWidth === "wide"
						? "Wide (5xl)"
						: "Full width"
				}`}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					{chatWidth === "narrow" && (
						<>
							<rect x="6" y="4" width="12" height="16" />
							<path d="M9 9h6m-6 6h6" />
						</>
					)}
					{chatWidth === "wide" && (
						<>
							<rect x="3" y="4" width="18" height="16" />
							<path d="M7 9h10m-10 6h10" />
						</>
					)}
					{chatWidth === "full" && (
						<>
							<rect x="2" y="4" width="20" height="16" />
							<path d="M6 9h12m-12 6h12" />
						</>
					)}
				</svg>
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
													{editingConversation === conv.id ? (
														<input
															type="text"
															value={editTitle}
															onChange={(e) => setEditTitle(e.target.value)}
															onBlur={() =>
																handleRenameConversation(conv.id, editTitle)
															}
															onKeyDown={(e) => {
																if (e.key === "Enter") {
																	handleRenameConversation(conv.id, editTitle);
																}
																if (e.key === "Escape") {
																	setEditingConversation(null);
																}
															}}
															onClick={(e) => e.stopPropagation()}
															autoFocus
															className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
														/>
													) : (
														<>
															<p className="text-sm truncate">{conv.title}</p>
															<p className="text-xs text-gray-500 mt-0.5">
																{new Date(conv.updatedAt).toLocaleDateString()}
															</p>
														</>
													)}
												</div>
												<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
													<button
														onClick={(e) => {
															e.stopPropagation();
															setEditingConversation(conv.id);
															setEditTitle(conv.title);
														}}
														className="p-1 rounded hover:bg-violet-500/20 text-violet-400"
													>
														<Pencil className="w-3.5 h-3.5" />
													</button>
													<button
														onClick={(e) => {
															e.stopPropagation();
															handleDeleteConversation(conv.id);
														}}
														className="p-1 rounded hover:bg-red-500/20 text-red-400"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												</div>
											</div>
										</div>
									))
								)}
							</div>

							{/* Sidebar Footer */}
							<div className="p-4 border-t border-gray-800 space-y-2">
								{/* Memory Settings Button */}
								<button
									onClick={() => setIsSettingsOpen(!isSettingsOpen)}
									className={cn(
										"w-full flex items-center gap-3 p-3 rounded-lg transition-all",
										isSettingsOpen
											? "bg-violet-500/20 text-violet-300"
											: "text-gray-400 hover:text-white hover:bg-gray-800/50"
									)}
								>
									<Brain className="w-5 h-5" />
									<span className="text-sm font-medium">Memory Settings</span>
								</button>

								{/* Collapse Sidebar Button */}
								<button
									onClick={() => setIsSidebarOpen(false)}
									className="w-full flex items-center justify-center p-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
									title="Collapse sidebar"
								>
									<ChevronLeft className="w-4 h-4" />
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
							<div
								className={cn(
									"mx-auto",
									chatWidth === "narrow"
										? "max-w-3xl"
										: chatWidth === "wide"
										? "max-w-5xl"
										: "max-w-full px-4"
								)}
							>
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
							<div
								className={cn(
									"mx-auto space-y-6",
									chatWidth === "narrow"
										? "max-w-3xl"
										: chatWidth === "wide"
										? "max-w-5xl"
										: "max-w-full px-4"
								)}
							>
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
												<div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
													<Image
														src="/Animating_Profile_DP_for_AI_Chat.gif"
														alt="AI"
														width={32}
														height={32}
														className="w-full h-full object-cover"
														unoptimized
													/>
												</div>
											)}
											<div
												className={cn(
													"max-w-[80%] rounded-2xl px-4 py-3 relative group/message",
													message.role === "user"
														? "bg-violet-600 text-white ml-auto"
														: "bg-gray-800/50 text-gray-100"
												)}
												onMouseEnter={() => setHoveredMessage(message.id)}
												onMouseLeave={() => setHoveredMessage(null)}
											>
												{/* Render media content (images/videos) */}
												{message.mediaType === "IMAGE" && message.imageUrl && (
													<div className="mb-3">
														<img
															src={message.imageUrl}
															alt="Generated image"
															className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
															onClick={() =>
																setLightboxImage(message.imageUrl!)
															}
														/>
														<div className="flex gap-2 mt-2">
															<button
																onClick={() => {
																	const link = document.createElement("a");
																	link.href = message.imageUrl!;
																	link.download = `amitymate-image-${Date.now()}.jpg`;
																	link.click();
																}}
																className="text-xs px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 rounded-lg flex items-center gap-1.5 transition-colors"
															>
																<Download className="w-3 h-3" />
																Download
															</button>
															<button
																onClick={() =>
																	setLightboxImage(message.imageUrl!)
																}
																className="text-xs px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 rounded-lg flex items-center gap-1.5 transition-colors"
															>
																<Maximize2 className="w-3 h-3" />
																View Full Size
															</button>
														</div>
													</div>
												)}

												{message.mediaType === "VIDEO" && message.videoUrl && (
													<div className="mb-3">
														<video
															src={message.videoUrl}
															controls
															className="rounded-lg max-w-full h-auto"
														/>
														<div className="flex gap-2 mt-2">
															<a
																href={message.videoUrl}
																download={`amitymate-video-${Date.now()}.mp4`}
																className="text-xs px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 rounded-lg flex items-center gap-1.5 transition-colors"
															>
																<Download className="w-3 h-3" />
																Download Video
															</a>
														</div>
													</div>
												)}

												{message.role === "user" ? (
													<>
														{/* Show reference image if present */}
														{message.imageUrl && (
															<div className="mb-3 border-2 border-white/20 rounded-lg overflow-hidden">
																<img
																	src={message.imageUrl}
																	alt="Reference image"
																	className="w-full max-w-sm h-auto"
																/>
																<div className="bg-white/10 px-2 py-1 text-xs">
																	📎 Reference Image
																</div>
															</div>
														)}
														<p className="whitespace-pre-wrap">
															{message.text}
														</p>
													</>
												) : (
													<>
														<div className="prose prose-invert prose-sm max-w-none">
															<ReactMarkdown
																remarkPlugins={[remarkGfm]}
																rehypePlugins={[rehypeHighlight, rehypeRaw]}
																components={{
																	// Custom styling for markdown elements
																	h1: ({ node, ...props }) => (
																		<h1
																			className="text-2xl font-bold mb-3 text-white"
																			{...props}
																		/>
																	),
																	h2: ({ node, ...props }) => (
																		<h2
																			className="text-xl font-bold mb-2 mt-4 text-violet-300"
																			{...props}
																		/>
																	),
																	h3: ({ node, ...props }) => (
																		<h3
																			className="text-lg font-semibold mb-2 mt-3 text-purple-300"
																			{...props}
																		/>
																	),
																	p: ({ node, ...props }) => (
																		<p
																			className="mb-2 leading-relaxed"
																			{...props}
																		/>
																	),
																	ul: ({ node, ...props }) => (
																		<ul
																			className="list-disc list-inside mb-2 space-y-1"
																			{...props}
																		/>
																	),
																	ol: ({ node, ...props }) => (
																		<ol
																			className="list-decimal list-inside mb-2 space-y-1"
																			{...props}
																		/>
																	),
																	li: ({ node, ...props }) => (
																		<li className="ml-2" {...props} />
																	),
																	code: ({
																		node,
																		className,
																		children,
																		...props
																	}) => {
																		const match = /language-(\w+)/.exec(
																			className || ""
																		);
																		const codeContent = String(
																			children
																		).replace(/\n$/, "");
																		const codeId = `${
																			message.id
																		}-${Math.random()}`;

																		return match ? (
																			// Inline code (no copy button needed)
																			<code
																				className="bg-gray-900 text-violet-300 px-1.5 py-0.5 rounded text-sm"
																				{...props}
																			>
																				{children}
																			</code>
																		) : (
																			// Inline code
																			<code
																				className="bg-gray-900 text-violet-300 px-1.5 py-0.5 rounded text-sm"
																				{...props}
																			>
																				{children}
																			</code>
																		);
																	},
																	pre: ({ node, children, ...props }) => {
																		// Extract code content for copy functionality
																		const codeElement = React.Children.toArray(
																			children
																		).find((child: any) =>
																			child?.props?.className?.includes(
																				"language-"
																			)
																		) as any;
																		const codeContent = codeElement?.props
																			?.children
																			? String(
																					codeElement.props.children
																			  ).replace(/\n$/, "")
																			: "";
																		// Use a stable ID based on message ID and content hash
																		const codeId = `${message.id}-${codeContent.length}`;
																		const language =
																			codeElement?.props?.className?.match(
																				/language-(\w+)/
																			)?.[1] || "text";

																		return (
																			<div className="relative group/code mb-4">
																				<div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg border-b border-gray-700">
																					<span className="text-xs text-gray-400 uppercase font-mono">
																						{language}
																					</span>
																					<button
																						onClick={() =>
																							copyToClipboard(
																								codeContent,
																								codeId
																							)
																						}
																						className={cn(
																							"flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all",
																							copiedCode === codeId
																								? "bg-green-600 text-white"
																								: "bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white"
																						)}
																						title={
																							copiedCode === codeId
																								? "Copied!"
																								: "Copy code"
																						}
																					>
																						{copiedCode === codeId ? (
																							<>
																								<Check className="w-3.5 h-3.5" />
																								<span className="text-xs font-medium">
																									Copied!
																								</span>
																							</>
																						) : (
																							<Copy className="w-3.5 h-3.5" />
																						)}
																					</button>
																				</div>
																				<pre
																					className="bg-gray-900 rounded-b-lg p-4 overflow-x-auto"
																					{...props}
																				>
																					{children}
																				</pre>
																			</div>
																		);
																	},
																	blockquote: ({ node, ...props }) => (
																		<blockquote
																			className="border-l-4 border-violet-500 pl-4 py-2 my-2 italic text-gray-300"
																			{...props}
																		/>
																	),
																	table: ({ node, ...props }) => (
																		<div className="overflow-x-auto mb-2">
																			<table
																				className="min-w-full border border-gray-700 rounded"
																				{...props}
																			/>
																		</div>
																	),
																	th: ({ node, ...props }) => (
																		<th
																			className="border border-gray-700 px-3 py-2 bg-gray-800 font-semibold"
																			{...props}
																		/>
																	),
																	td: ({ node, ...props }) => (
																		<td
																			className="border border-gray-700 px-3 py-2"
																			{...props}
																		/>
																	),
																	strong: ({ node, ...props }) => (
																		<strong
																			className="font-bold text-white"
																			{...props}
																		/>
																	),
																	em: ({ node, ...props }) => (
																		<em
																			className="italic text-violet-300"
																			{...props}
																		/>
																	),
																	a: ({ node, ...props }) => (
																		<a
																			className="text-violet-400 hover:text-violet-300 underline"
																			target="_blank"
																			rel="noopener noreferrer"
																			{...props}
																		/>
																	),
																}}
															>
																{message.text}
															</ReactMarkdown>
														</div>

														{/* Message Actions - Only for AI messages */}
														{hoveredMessage === message.id && (
															<div className="absolute -bottom-8 left-0 flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 shadow-lg">
																<button
																	onClick={() =>
																		copyMessage(message.text, message.id)
																	}
																	className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
																	title="Copy message"
																>
																	{copiedMessage === message.id ? (
																		<Check className="w-3.5 h-3.5 text-green-400" />
																	) : (
																		<Copy className="w-3.5 h-3.5" />
																	)}
																</button>
																<button
																	onClick={() => handleRegenerateResponse()}
																	className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
																	title="Regenerate response"
																>
																	<RotateCw className="w-3.5 h-3.5" />
																</button>
																<button
																	className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
																	title="Good response"
																>
																	<ThumbsUp className="w-3.5 h-3.5" />
																</button>
																<button
																	className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
																	title="Bad response"
																>
																	<ThumbsDown className="w-3.5 h-3.5" />
																</button>
															</div>
														)}
													</>
												)}
											</div>
											{message.role === "user" && (
												<div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
													{user?.imageUrl ? (
														<Image
															src={user.imageUrl}
															alt={user.firstName || "User"}
															width={32}
															height={32}
															className="w-full h-full object-cover"
														/>
													) : (
														<div className="w-full h-full bg-violet-600 flex items-center justify-center text-sm font-medium text-white">
															{user?.firstName?.charAt(0) || "U"}
														</div>
													)}
												</div>
											)}
										</div>
									))
								)}

								{isTyping && (
									<div className="flex gap-4">
										<div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
											<Image
												src="/Animating_Profile_DP_for_AI_Chat.gif"
												alt="AI"
												width={32}
												height={32}
												className="w-full h-full object-cover"
												unoptimized
											/>
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
						<div
							className={cn(
								"mx-auto",
								chatWidth === "narrow"
									? "max-w-3xl"
									: chatWidth === "wide"
									? "max-w-5xl"
									: "max-w-full px-4"
							)}
						>
							{/* Compact Mode Selector - Gemini Style */}
							<div className="flex items-center gap-3 mb-2 flex-wrap">
								<select
									value={chatMode}
									onChange={(e) => setChatMode(e.target.value as ChatMode)}
									className="bg-gray-900/50 border border-gray-800 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
								>
									<option value="text">💬 Text Chat</option>
									<option value="image">🎨 Create Images</option>
									<option value="video">🎬 Create Videos</option>
								</select>

								{/* Text Mode Options */}
								{chatMode === "text" && (
									<select
										value={selectedModel}
										onChange={(e) =>
											setSelectedModel(e.target.value as "fast" | "advanced")
										}
										className="bg-gray-900/50 border border-gray-800 text-gray-400 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-violet-500 transition-colors"
									>
										<option value="fast">⚡ Gemini 2.5 Flash</option>
										<option value="advanced">🧠 Gemini 2.5 Pro</option>
									</select>
								)}

								{/* Image Mode Options */}
								{chatMode === "image" && (
									<div className="flex items-center gap-2 flex-wrap">
										<select
											value={imageModel}
											onChange={(e) =>
												setImageModel(e.target.value as ImageModel)
											}
											className="bg-gray-900/50 border border-gray-800 text-gray-400 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500 transition-colors"
										>
											<option value="imagen">🎨 Imagen 4.0</option>
											<option value="nano">⚡ Nano Banana</option>
										</select>
										<span className="text-gray-700">|</span>
										<select
											value={aspectRatio}
											onChange={(e) =>
												setAspectRatio(e.target.value as AspectRatio)
											}
											className="bg-gray-900/50 border border-gray-800 text-gray-400 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500 transition-colors"
										>
											<option value="1:1">□ 1:1</option>
											<option value="4:3">▭ 4:3</option>
											<option value="16:9">▬ 16:9</option>
										</select>
										{imageModel === "nano" && (
											<>
												<span className="text-gray-700">|</span>
												<input
													ref={fileInputRef}
													type="file"
													accept="image/*"
													onChange={handleFileUpload}
													className="hidden"
												/>
												<button
													onClick={() => fileInputRef.current?.click()}
													className="text-xs px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg flex items-center gap-1 transition-colors"
													title="Upload reference image"
												>
													<ImageIcon className="w-3 h-3" />
													Reference
												</button>
											</>
										)}
									</div>
								)}

								{/* Video Mode Options */}
								{chatMode === "video" && (
									<div className="flex items-center gap-2 flex-wrap">
										<select
											value={videoModel}
											onChange={(e) =>
												setVideoModel(e.target.value as VideoModel)
											}
											className="bg-gray-900/50 border border-gray-800 text-gray-400 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-pink-500 transition-colors"
										>
											<option value="fast">⚡ Veo 3.1 Fast</option>
											<option value="hq">💎 Veo 3.1 HQ</option>
										</select>
										<span className="text-gray-700">|</span>
										<select
											value={aspectRatio}
											onChange={(e) =>
												setAspectRatio(e.target.value as AspectRatio)
											}
											className="bg-gray-900/50 border border-gray-800 text-gray-400 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-pink-500 transition-colors"
										>
											<option value="16:9">▬ 16:9 Landscape</option>
											<option value="9:16">▮ 9:16 Portrait</option>
										</select>
										<span className="text-gray-700">|</span>
										<select
											value={resolution}
											onChange={(e) =>
												setResolution(e.target.value as Resolution)
											}
											className="bg-gray-900/50 border border-gray-800 text-gray-400 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-pink-500 transition-colors"
										>
											<option value="720p">📺 720p</option>
											<option value="1080p">🎬 1080p</option>
										</select>
										<span className="text-gray-700">|</span>
										<input
											ref={fileInputRef}
											type="file"
											accept="image/*"
											onChange={handleFileUpload}
											className="hidden"
										/>
										<button
											onClick={() => fileInputRef.current?.click()}
											className="text-xs px-2 py-1 bg-pink-600/20 hover:bg-pink-600/30 rounded-lg flex items-center gap-1 transition-colors"
											title="Upload reference image"
										>
											<ImageIcon className="w-3 h-3" />
											Reference
										</button>
									</div>
								)}
							</div>

							<div className="relative bg-gray-900/50 rounded-2xl border border-gray-800 focus-within:border-violet-500 transition-colors">
								<div className="flex items-end gap-2">
									{/* Compact Image Chip - Gemini Style */}
									{referenceImage &&
										(chatMode === "image" || chatMode === "video") && (
											<div className="ml-2 mb-2 flex-shrink-0">
												<div className="relative inline-flex items-center gap-1.5 px-2 py-1 bg-violet-600/20 border border-violet-500/30 rounded-full group hover:bg-violet-600/30 transition-colors">
													<img
														src={`data:image/png;base64,${referenceImage}`}
														alt="Reference"
														className="h-5 w-5 object-cover rounded-full"
													/>
													<span className="text-[10px] text-violet-300 font-medium">
														Image
													</span>
													<button
														onClick={() => setReferenceImage(null)}
														className="p-0.5 rounded-full hover:bg-red-500/50 transition-colors"
													>
														<X className="w-3 h-3 text-gray-300" />
													</button>
												</div>
											</div>
										)}

									<textarea
										ref={textareaRef}
										value={inputText}
										onChange={handleInputChange}
										onKeyDown={handleKeyDown}
										onPaste={handlePaste}
										placeholder={
											chatMode === "text"
												? "Ask me anything..."
												: chatMode === "image"
												? "Describe your image..."
												: "Describe your video..."
										}
										rows={1}
										className="flex-1 bg-transparent text-white placeholder-gray-500 px-4 py-3 resize-none focus:outline-none max-h-[120px] overflow-y-auto text-sm"
									/>
									<button
										onClick={handleSend}
										disabled={!inputText.trim() || isTyping || isGenerating}
										className={cn(
											"m-2 p-2.5 rounded-lg transition-all flex-shrink-0",
											inputText.trim() && !isTyping && !isGenerating
												? chatMode === "image"
													? "bg-purple-600 hover:bg-purple-500 text-white"
													: chatMode === "video"
													? "bg-pink-600 hover:bg-pink-500 text-white"
													: "bg-violet-600 hover:bg-violet-500 text-white"
												: "bg-gray-800 text-gray-600 cursor-not-allowed"
										)}
									>
										{isTyping || isGenerating ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : chatMode === "image" ? (
											<ImageIcon className="w-4 h-4" />
										) : chatMode === "video" ? (
											<Video className="w-4 h-4" />
										) : (
											<Send className="w-4 h-4" />
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
			</div>

			{/* Memory Settings Panel */}
			<AnimatePresence>
				{isSettingsOpen && (
					<motion.div
						initial={{ x: "100%" }}
						animate={{ x: 0 }}
						exit={{ x: "100%" }}
						transition={{ type: "spring", damping: 25, stiffness: 200 }}
						className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-gray-900/98 backdrop-blur-xl border-l border-gray-800 z-[110] overflow-hidden"
					>
						<div className="h-full flex flex-col">
							{/* Settings Header */}
							<div className="flex items-center justify-between p-6 border-b border-gray-800">
								<div className="flex items-center gap-3">
									<div className="p-2 rounded-xl bg-violet-500/20">
										<Brain className="w-5 h-5 text-violet-400" />
									</div>
									<div>
										<h2 className="text-lg font-bold text-white">
											Memory Settings
										</h2>
										<p className="text-xs text-gray-400">
											Manage what AI remembers about you
										</p>
									</div>
								</div>
								<button
									onClick={() => setIsSettingsOpen(false)}
									className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
								>
									<X className="w-5 h-5 text-gray-400" />
								</button>
							</div>

							{/* Memory Manager */}
							<div className="flex-1 overflow-hidden">
								<MemoryManager compact={false} />
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Image Lightbox */}
			<AnimatePresence>
				{lightboxImage && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
						onClick={() => setLightboxImage(null)}
					>
						<motion.div
							initial={{ scale: 0.9 }}
							animate={{ scale: 1 }}
							exit={{ scale: 0.9 }}
							className="relative max-w-7xl max-h-[90vh]"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								onClick={() => setLightboxImage(null)}
								className="absolute -top-12 right-0 p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 transition-colors"
							>
								<X className="w-6 h-6" />
							</button>
							<img
								src={lightboxImage}
								alt="Full size"
								className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
							/>
							<div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-3">
								<button
									onClick={() => {
										const link = document.createElement("a");
										link.href = lightboxImage;
										link.download = `amitymate-image-${Date.now()}.jpg`;
										link.click();
									}}
									className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg flex items-center gap-2 transition-colors"
								>
									<Download className="w-4 h-4" />
									Download
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Bottom Navigation (Mobile) */}
			<div className="md:hidden">
				<BottomNav />
			</div>
		</div>
	);
}
