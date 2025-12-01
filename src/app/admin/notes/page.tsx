"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Upload,
	FileText,
	Trash2,
	Download,
	Eye,
	Loader2,
	CheckCircle,
	XCircle,
	BookText,
	Filter,
	Search,
} from "lucide-react";
import { getCourses, getBatches, getSemesters, getSubjects } from "../actions";
import { useDropzone } from "react-dropzone";

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
	isPublic: boolean;
	createdAt: string;
	subject: {
		id: string;
		code: string;
		name: string;
	};
}

export default function NotesManagementPage() {
	// Data states
	const [courses, setCourses] = useState<any[]>([]);
	const [batches, setBatches] = useState<any[]>([]);
	const [semesters, setSemesters] = useState<any[]>([]);
	const [subjects, setSubjects] = useState<any[]>([]);
	const [notes, setNotes] = useState<Note[]>([]);

	// Selection states
	const [selectedCourseId, setSelectedCourseId] = useState("");
	const [selectedBatchId, setSelectedBatchId] = useState("");
	const [selectedSemesterId, setSelectedSemesterId] = useState("");
	const [selectedSubjectId, setSelectedSubjectId] = useState("");

	// Form states
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [isPublic, setIsPublic] = useState(true);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	// UI states
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [uploadStatus, setUploadStatus] = useState<{
		type: "success" | "error" | null;
		message: string;
	}>({ type: null, message: "" });
	const [searchQuery, setSearchQuery] = useState("");

	// Dropzone
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		accept: {
			"application/pdf": [".pdf"],
			"application/msword": [".doc"],
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
				[".docx"],
			"application/vnd.ms-powerpoint": [".ppt"],
			"application/vnd.openxmlformats-officedocument.presentationml.presentation":
				[".pptx"],
			"image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
		},
		multiple: false,
		onDrop: (acceptedFiles) => {
			if (acceptedFiles.length > 0) {
				setSelectedFile(acceptedFiles[0]);
			}
		},
	});

	// Load initial data
	useEffect(() => {
		async function loadCourses() {
			const result = await getCourses();
			if (result.success && result.data) {
				setCourses(result.data);
			}
			setLoading(false);
		}
		loadCourses();
		loadNotes();
	}, []);

	// Cascading dropdowns
	useEffect(() => {
		async function loadBatches() {
			if (selectedCourseId) {
				const result = await getBatches(selectedCourseId);
				if (result.success && result.data) {
					setBatches(result.data);
				}
			} else {
				setBatches([]);
			}
			setSelectedBatchId("");
			setSemesters([]);
			setSelectedSemesterId("");
			setSubjects([]);
			setSelectedSubjectId("");
		}
		loadBatches();
	}, [selectedCourseId]);

	useEffect(() => {
		async function loadSemesters() {
			if (selectedBatchId) {
				const result = await getSemesters(selectedBatchId);
				if (result.success && result.data) {
					setSemesters(result.data);
				}
			} else {
				setSemesters([]);
			}
			setSelectedSemesterId("");
			setSubjects([]);
			setSelectedSubjectId("");
		}
		loadSemesters();
	}, [selectedBatchId]);

	useEffect(() => {
		async function loadSubjects() {
			if (selectedSemesterId) {
				const result = await getSubjects(selectedSemesterId);
				if (result.success && result.data) {
					setSubjects(result.data);
				}
			} else {
				setSubjects([]);
			}
			setSelectedSubjectId("");
		}
		loadSubjects();
	}, [selectedSemesterId]);

	// Load notes
	async function loadNotes(subjectId?: string) {
		try {
			const url = subjectId
				? `/api/admin/notes?subjectId=${subjectId}`
				: "/api/admin/notes";
			const response = await fetch(url);
			const data = await response.json();
			if (data.success) {
				setNotes(data.notes);
			}
		} catch (error) {
			console.error("Failed to load notes:", error);
		}
	}

	// Upload note
	async function handleUpload() {
		if (!selectedFile || !selectedSubjectId || !title.trim()) {
			setUploadStatus({
				type: "error",
				message: "Please fill all required fields and select a file",
			});
			return;
		}

		setUploading(true);
		setUploadStatus({ type: null, message: "" });

		try {
			const formData = new FormData();
			formData.append("file", selectedFile);
			formData.append("subjectId", selectedSubjectId);
			formData.append("title", title);
			formData.append("description", description);
			formData.append("isPublic", isPublic.toString());

			const response = await fetch("/api/admin/notes", {
				method: "POST",
				body: formData,
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Upload failed");
			}

			setUploadStatus({
				type: "success",
				message: "Note uploaded and processed successfully!",
			});

			// Reset form
			setTitle("");
			setDescription("");
			setSelectedFile(null);

			// Reload notes
			await loadNotes();
		} catch (error) {
			setUploadStatus({
				type: "error",
				message: error instanceof Error ? error.message : "Upload failed",
			});
		} finally {
			setUploading(false);
		}
	}

	// Delete note
	async function handleDelete(id: string) {
		if (!confirm("Are you sure you want to delete this note?")) return;

		try {
			const response = await fetch(`/api/admin/notes?id=${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Delete failed");
			}

			await loadNotes();
		} catch (error) {
			alert("Failed to delete note");
		}
	}

	// Format file size
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		return (bytes / (1024 * 1024)).toFixed(1) + " MB";
	}

	// Filter notes
	const filteredNotes = notes.filter(
		(note) =>
			note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			note.subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			note.keyTopics.some((topic) =>
				topic.toLowerCase().includes(searchQuery.toLowerCase())
			)
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-white flex items-center gap-2">
					<BookText className="w-6 h-6 text-violet-400" />
					Notes Management
				</h1>
				<p className="text-gray-400 text-sm">
					Upload study materials, AI will extract content for predictions
				</p>
			</div>

			<div className="grid lg:grid-cols-2 gap-6">
				{/* Left: Upload Form */}
				<div className="space-y-6">
					{/* Subject Selection */}
					<div className="card p-6 space-y-4">
						<h3 className="text-lg font-semibold text-white">
							1. Select Subject
						</h3>

						<div className="grid grid-cols-2 gap-4">
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

							<div className="space-y-2">
								<label className="text-sm text-gray-400">Subject *</label>
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

					{/* File Upload */}
					<div className="card p-6 space-y-4">
						<h3 className="text-lg font-semibold text-white">2. Upload Note</h3>

						<div
							{...getRootProps()}
							className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
								isDragActive
									? "border-violet-500 bg-violet-500/10"
									: "border-gray-700 hover:border-violet-500"
							}`}
						>
							<input {...getInputProps()} />
							<Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
							{selectedFile ? (
								<div>
									<p className="text-white font-medium">{selectedFile.name}</p>
									<p className="text-gray-500 text-sm">
										{formatFileSize(selectedFile.size)}
									</p>
								</div>
							) : (
								<div>
									<p className="text-white mb-1">
										Drop file here or click to browse
									</p>
									<p className="text-gray-500 text-sm">
										PDF, DOCX, PPT, or Images
									</p>
								</div>
							)}
						</div>

						<div className="space-y-2">
							<label className="text-sm text-gray-400">Title *</label>
							<input
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g., DBMS Complete Notes"
								className="input w-full"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm text-gray-400">
								Description (Optional)
							</label>
							<textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Brief description of the content..."
								rows={3}
								className="input w-full resize-none"
							/>
						</div>

						<div className="flex items-center gap-3">
							<button
								onClick={() => setIsPublic(!isPublic)}
								className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
									isPublic
										? "bg-green-500/20 border border-green-500/30 text-green-300"
										: "bg-gray-800 border border-gray-700 text-gray-400"
								}`}
							>
								{isPublic ? (
									<CheckCircle className="w-4 h-4" />
								) : (
									<XCircle className="w-4 h-4" />
								)}
								<span className="text-sm">Public (Students can access)</span>
							</button>
						</div>

						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={handleUpload}
							disabled={uploading || !selectedFile || !selectedSubjectId}
							className="btn-primary w-full disabled:opacity-50"
						>
							{uploading ? (
								<>
									<Loader2 className="w-5 h-5 animate-spin" />
									Processing...
								</>
							) : (
								<>
									<Upload className="w-5 h-5" />
									Upload & Process
								</>
							)}
						</motion.button>

						{/* Upload Status */}
						{uploadStatus.type && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className={`flex items-center gap-3 p-4 rounded-xl ${
									uploadStatus.type === "success"
										? "bg-green-500/10 border border-green-500/20"
										: "bg-red-500/10 border border-red-500/20"
								}`}
							>
								{uploadStatus.type === "success" ? (
									<CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
								) : (
									<XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
								)}
								<p
									className={`text-sm ${
										uploadStatus.type === "success"
											? "text-green-300"
											: "text-red-300"
									}`}
								>
									{uploadStatus.message}
								</p>
							</motion.div>
						)}
					</div>
				</div>

				{/* Right: Notes List */}
				<div className="space-y-6">
					<div className="card p-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-white">
								Uploaded Notes ({filteredNotes.length})
							</h3>
						</div>

						{/* Search */}
						<div className="relative mb-4">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search notes..."
								className="input w-full pl-10"
							/>
						</div>

						{/* Notes List */}
						<div className="space-y-3 max-h-[700px] overflow-y-auto">
							{filteredNotes.length === 0 ? (
								<div className="text-center py-8">
									<FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
									<p className="text-gray-500">No notes uploaded yet</p>
								</div>
							) : (
								<AnimatePresence>
									{filteredNotes.map((note) => (
										<motion.div
											key={note.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -20 }}
											className="card p-4 space-y-3"
										>
											{/* Header */}
											<div className="flex items-start justify-between gap-3">
												<div className="flex-1">
													<h4 className="text-white font-medium">
														{note.title}
													</h4>
													<p className="text-gray-400 text-sm">
														{note.subject.code} - {note.subject.name}
													</p>
												</div>

												<div className="flex items-center gap-2">
													<a
														href={note.fileUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="p-2 rounded-lg hover:bg-white/10 text-cyan-400 transition-colors"
													>
														<Eye className="w-4 h-4" />
													</a>
													<a
														href={note.fileUrl}
														download
														className="p-2 rounded-lg hover:bg-white/10 text-green-400 transition-colors"
													>
														<Download className="w-4 h-4" />
													</a>
													<button
														onClick={() => handleDelete(note.id)}
														className="p-2 rounded-lg hover:bg-white/10 text-red-400 transition-colors"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											</div>

											{/* Meta */}
											<div className="flex flex-wrap gap-2 text-xs">
												<span className="px-2 py-1 rounded-full bg-violet-500/20 text-violet-300">
													{note.fileType.toUpperCase()}
												</span>
												<span className="px-2 py-1 rounded-full bg-gray-700 text-gray-300">
													{formatFileSize(note.fileSize)}
												</span>
												<span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300">
													{note.downloadCount} downloads
												</span>
												{note.isPublic ? (
													<span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300">
														Public
													</span>
												) : (
													<span className="px-2 py-1 rounded-full bg-red-500/20 text-red-300">
														Private
													</span>
												)}
											</div>

											{/* Topics */}
											{note.keyTopics.length > 0 && (
												<div>
													<p className="text-gray-500 text-xs mb-1">Topics:</p>
													<div className="flex flex-wrap gap-1">
														{note.keyTopics.slice(0, 5).map((topic, i) => (
															<span
																key={i}
																className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300"
															>
																{topic}
															</span>
														))}
														{note.keyTopics.length > 5 && (
															<span className="text-xs px-2 py-0.5 text-gray-500">
																+{note.keyTopics.length - 5} more
															</span>
														)}
													</div>
												</div>
											)}

											{/* Modules */}
											{note.moduleNumbers.length > 0 && (
												<div>
													<p className="text-gray-500 text-xs">
														Modules: {note.moduleNumbers.join(", ")}
													</p>
												</div>
											)}
										</motion.div>
									))}
								</AnimatePresence>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
