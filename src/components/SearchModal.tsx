"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, FileText, BookOpen, HelpCircle, File, X } from "lucide-react";
import { Input, Badge } from "@/components/ui";
import { useRouter } from "next/navigation";

interface SearchResult {
	id: string;
	type: string;
	title: string;
	subtitle: string;
	description: string;
	url: string;
	[key: string]: any;
}

interface SearchModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const typeIcons: Record<string, any> = {
	subject: BookOpen,
	note: FileText,
	question: HelpCircle,
	syllabus: File,
};

const typeColors: Record<string, string> = {
	subject: "violet",
	note: "green",
	question: "blue",
	syllabus: "yellow",
};

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const router = useRouter();

	// Handle Cmd+K / Ctrl+K
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				if (isOpen) {
					onClose();
				}
			}

			if (isOpen) {
				if (e.key === "Escape") {
					onClose();
				} else if (e.key === "ArrowDown") {
					e.preventDefault();
					setSelectedIndex((prev) => (prev + 1) % results.length);
				} else if (e.key === "ArrowUp") {
					e.preventDefault();
					setSelectedIndex(
						(prev) => (prev - 1 + results.length) % results.length
					);
				} else if (e.key === "Enter" && results.length > 0) {
					e.preventDefault();
					handleSelect(results[selectedIndex]);
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, results, selectedIndex, onClose]);

	// Reset when modal opens/closes
	useEffect(() => {
		if (!isOpen) {
			setQuery("");
			setResults([]);
			setSelectedIndex(0);
		}
	}, [isOpen]);

	// Debounced search
	useEffect(() => {
		if (query.trim().length < 2) {
			setResults([]);
			return;
		}

		const timer = setTimeout(() => {
			performSearch(query);
		}, 300);

		return () => clearTimeout(timer);
	}, [query]);

	const performSearch = async (searchQuery: string) => {
		try {
			setLoading(true);
			const res = await fetch(
				`/api/search?q=${encodeURIComponent(searchQuery)}`
			);
			if (!res.ok) throw new Error("Search failed");

			const data = await res.json();

			// Flatten results
			const allResults: SearchResult[] = [
				...data.results.subjects,
				...data.results.notes,
				...data.results.questions,
				...data.results.syllabi,
			];

			setResults(allResults);
			setSelectedIndex(0);
		} catch (error) {
			console.error("Error performing search:", error);
			setResults([]);
		} finally {
			setLoading(false);
		}
	};

	const handleSelect = useCallback(
		(result: SearchResult) => {
			router.push(result.url);
			onClose();
		},
		[router, onClose]
	);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
				{/* Search Input */}
				<div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
					<Search className="w-5 h-5 text-gray-400" />
					<Input
						type="text"
						placeholder="Search subjects, notes, questions, syllabi..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="border-0 bg-transparent focus:ring-0 text-white placeholder-gray-500"
						autoFocus
					/>
					<button
						onClick={onClose}
						className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Results */}
				<div className="max-h-[60vh] overflow-y-auto">
					{loading ? (
						<div className="p-8 text-center">
							<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
							<p className="text-gray-400 mt-4">Searching...</p>
						</div>
					) : results.length === 0 ? (
						<div className="p-8 text-center">
							{query.trim().length === 0 ? (
								<>
									<Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
									<p className="text-gray-400">
										Start typing to search across subjects, notes, questions,
										and syllabi
									</p>
									<div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
										<kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs">
											{typeof window !== "undefined" &&
											navigator.platform.includes("Mac")
												? "⌘"
												: "Ctrl"}
										</kbd>
										<span>+</span>
										<kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs">
											K
										</kbd>
										<span>to open/close</span>
									</div>
								</>
							) : (
								<>
									<Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
									<p className="text-gray-400">
										No results found for &quot;{query}&quot;
									</p>
									<p className="text-gray-500 text-sm mt-2">
										Try different keywords or check your spelling
									</p>
								</>
							)}
						</div>
					) : (
						<div className="py-2">
							{results.map((result, index) => {
								const Icon = typeIcons[result.type] || FileText;
								const isSelected = index === selectedIndex;

								return (
									<button
										key={result.id}
										onClick={() => handleSelect(result)}
										className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors ${
											isSelected ? "bg-white/5" : ""
										}`}
									>
										<div
											className={`p-2 rounded-lg ${
												isSelected ? "bg-violet-500/20" : "bg-white/5"
											}`}
										>
											<Icon
												className={`w-5 h-5 ${
													isSelected ? "text-violet-400" : "text-gray-400"
												}`}
											/>
										</div>

										<div className="flex-1 text-left">
											<div className="flex items-center gap-2 mb-1">
												<p className="text-white font-medium">{result.title}</p>
												<Badge color={typeColors[result.type]}>
													{result.type}
												</Badge>
											</div>
											<p className="text-gray-400 text-sm">{result.subtitle}</p>
											{result.description && (
												<p className="text-gray-500 text-xs mt-1">
													{result.description}
												</p>
											)}
										</div>

										{isSelected && (
											<div className="text-gray-500 text-sm">
												<kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs">
													↵
												</kbd>
											</div>
										)}
									</button>
								);
							})}
						</div>
					)}
				</div>

				{/* Footer */}
				{results.length > 0 && (
					<div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-1">
								<kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded">
									↑
								</kbd>
								<kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded">
									↓
								</kbd>
								<span>Navigate</span>
							</div>
							<div className="flex items-center gap-1">
								<kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded">
									↵
								</kbd>
								<span>Select</span>
							</div>
							<div className="flex items-center gap-1">
								<kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded">
									Esc
								</kbd>
								<span>Close</span>
							</div>
						</div>
						<div>{results.length} results</div>
					</div>
				)}
			</div>
		</div>
	);
}
