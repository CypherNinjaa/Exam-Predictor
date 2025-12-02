"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
	BookText,
	Download,
	FileText,
	Filter,
	Search,
	Eye,
	Loader2,
} from "lucide-react";
import { Navbar, MobileHeader, BottomNav } from "@/components/layout";

interface Note {
	id: string;
	title: string;
	description: string | null;
	fileName: string;
	fileUrl: string;
	fileType: string;
	fileSize: number;
	keyTopics: string[];
	moduleNumbers: number[];
	downloadCount: number;
	createdAt: string;
	subject: {
		id: string;
		code: string;
		name: string;
	};
}

export default function NotesPage() {
	const [notes, setNotes] = useState<Note[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedSubject, setSelectedSubject] = useState<string>("all");

	useEffect(() => {
		loadNotes();
	}, []);

	async function loadNotes() {
		try {
			const response = await fetch("/api/notes");
			const data = await response.json();
			if (data.success) {
				setNotes(data.notes);
			}
		} catch (error) {
			console.error("Failed to load notes:", error);
		} finally {
			setLoading(false);
		}
	}

	async function handleDownload(noteId: string, fileUrl: string) {
		// Track download
		await fetch(`/api/notes?download=true&id=${noteId}`);

		// Trigger download
		window.open(fileUrl, "_blank");
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		return (bytes / (1024 * 1024)).toFixed(1) + " MB";
	}

	// Get unique subjects
	const subjects = Array.from(
		new Set(notes.map((n) => JSON.stringify(n.subject)))
	).map((s) => JSON.parse(s));

	// Filter notes
	const filteredNotes = notes.filter((note) => {
		const matchesSearch =
			note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			note.subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			note.keyTopics.some((topic) =>
				topic.toLowerCase().includes(searchQuery.toLowerCase())
			);

		const matchesSubject =
			selectedSubject === "all" || note.subject.id === selectedSubject;

		return matchesSearch && matchesSubject;
	});

	return (
		<>
			<Navbar />
			<MobileHeader />

			<div className="container max-w-6xl mx-auto px-4 pt-24 pb-safe md:pt-32 md:pb-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
						<BookText className="w-8 h-8 text-violet-400" />
						Study Notes
					</h1>
					<p className="text-gray-400">
						Download study materials and notes shared by your community
					</p>
				</div>

				{/* Filters */}
				<div className="card p-6 mb-6">
					<div className="grid md:grid-cols-2 gap-4">
						{/* Search */}
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search notes by title, subject, or topic..."
								className="input w-full pl-11"
							/>
						</div>

						{/* Subject Filter */}
						<div className="relative">
							<Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
							<select
								value={selectedSubject}
								onChange={(e) => setSelectedSubject(e.target.value)}
								className="select w-full pl-11"
							>
								<option value="all">All Subjects</option>
								{subjects.map((subject) => (
									<option key={subject.id} value={subject.id}>
										{subject.code} - {subject.name}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
						<span>
							<strong className="text-white">{filteredNotes.length}</strong>{" "}
							notes available
						</span>
						<span>•</span>
						<span>
							<strong className="text-white">{subjects.length}</strong> subjects
						</span>
					</div>
				</div>

				{/* Loading */}
				{loading && (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
						<span className="ml-3 text-gray-400">Loading notes...</span>
					</div>
				)}

				{/* Notes Grid */}
				{!loading && filteredNotes.length === 0 && (
					<div className="text-center py-12">
						<FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
						<h3 className="text-xl font-semibold text-white mb-2">
							No notes found
						</h3>
						<p className="text-gray-500">
							{searchQuery || selectedSubject !== "all"
								? "Try adjusting your filters"
								: "Check back later for study materials"}
						</p>
					</div>
				)}

				{!loading && filteredNotes.length > 0 && (
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredNotes.map((note, index) => (
							<motion.div
								key={note.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05 }}
								className="card p-6 space-y-4 hover:border-violet-500/30 transition-colors"
							>
								{/* Header */}
								<div>
									<div className="flex items-start justify-between gap-3 mb-2">
										<h3 className="text-white font-semibold flex-1">
											{note.title}
										</h3>
										<FileText className="w-5 h-5 text-violet-400 flex-shrink-0" />
									</div>
									<p className="text-gray-400 text-sm">
										{note.subject.code} - {note.subject.name}
									</p>
								</div>

								{/* Description */}
								{note.description && (
									<p className="text-gray-500 text-sm line-clamp-2">
										{note.description}
									</p>
								)}

								{/* Topics */}
								{note.keyTopics.length > 0 && (
									<div>
										<p className="text-gray-500 text-xs mb-2">Key Topics:</p>
										<div className="flex flex-wrap gap-1">
											{note.keyTopics.slice(0, 4).map((topic, i) => (
												<span
													key={i}
													className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300"
												>
													{topic}
												</span>
											))}
											{note.keyTopics.length > 4 && (
												<span className="text-xs px-2 py-1 text-gray-500">
													+{note.keyTopics.length - 4}
												</span>
											)}
										</div>
									</div>
								)}

								{/* Meta Info */}
								<div className="flex flex-wrap gap-2 text-xs text-gray-500">
									<span className="px-2 py-1 rounded-full bg-gray-800">
										{note.fileType.toUpperCase()}
									</span>
									<span className="px-2 py-1 rounded-full bg-gray-800">
										{formatFileSize(note.fileSize)}
									</span>
									<span className="px-2 py-1 rounded-full bg-gray-800">
										{note.downloadCount} downloads
									</span>
								</div>

								{/* Modules */}
								{note.moduleNumbers.length > 0 && (
									<p className="text-xs text-gray-500">
										Covers Modules: {note.moduleNumbers.join(", ")}
									</p>
								)}

								{/* Actions */}
								<div className="flex gap-2 pt-2">
									<a
										href={note.fileUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm"
									>
										<Eye className="w-4 h-4" />
										Preview
									</a>
									<button
										onClick={() => handleDownload(note.id, note.fileUrl)}
										className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
									>
										<Download className="w-4 h-4" />
										Download
									</button>
								</div>
							</motion.div>
						))}
					</div>
				)}
			</div>

			<BottomNav />
		</>
	);
}
