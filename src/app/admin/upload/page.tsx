"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
	Upload,
	FileText,
	FileQuestion,
	BookOpen,
	X,
	CheckCircle,
	AlertCircle,
	Loader2,
	Sparkles,
	GraduationCap,
	BookMarked,
	Users,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { getCourses, getBatches, getSemesters, getSubjects } from "../actions";

type UploadType = "syllabus" | "exam" | "notes";

interface UploadState {
	file: File | null;
	status: "idle" | "uploading" | "processing" | "success" | "error";
	message: string;
}

interface Course {
	id: string;
	name: string;
	code: string;
	duration: number;
}

interface Batch {
	id: string;
	startYear: number;
	endYear: number;
	courseId: string;
	course: { name: string; code: string };
}

interface Semester {
	id: string;
	number: number;
	batchId: string;
}

interface Subject {
	id: string;
	name: string;
	code: string;
	semesterId: string;
}

export default function AdminUploadPage() {
	const [uploadType, setUploadType] = useState<UploadType>("syllabus");
	const [uploadState, setUploadState] = useState<UploadState>({
		file: null,
		status: "idle",
		message: "",
	});

	// Data states
	const [courses, setCourses] = useState<Course[]>([]);
	const [batches, setBatches] = useState<Batch[]>([]);
	const [semesters, setSemesters] = useState<Semester[]>([]);
	const [subjects, setSubjects] = useState<Subject[]>([]);

	// Selection states
	const [selectedCourseId, setSelectedCourseId] = useState<string>("");
	const [selectedBatchId, setSelectedBatchId] = useState<string>("");
	const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
	const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
	const [examType, setExamType] = useState<string>("");
	const [loading, setLoading] = useState(true);

	// Load courses on mount
	useEffect(() => {
		async function loadCourses() {
			try {
				const result = await getCourses();
				if (result.success && result.data) {
					setCourses(result.data);
				}
			} catch (error) {
				console.error("Failed to load courses:", error);
			} finally {
				setLoading(false);
			}
		}
		loadCourses();
	}, []);

	// Load batches when course changes
	useEffect(() => {
		async function loadBatches() {
			if (selectedCourseId) {
				try {
					const result = await getBatches(selectedCourseId);
					if (result.success && result.data) {
						setBatches(result.data);
					}
				} catch (error) {
					console.error("Failed to load batches:", error);
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

	// Load semesters when batch changes
	useEffect(() => {
		async function loadSemesters() {
			if (selectedBatchId) {
				try {
					const result = await getSemesters(selectedBatchId);
					if (result.success && result.data) {
						setSemesters(result.data);
					}
				} catch (error) {
					console.error("Failed to load semesters:", error);
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

	// Load subjects when semester changes
	useEffect(() => {
		async function loadSubjects() {
			if (selectedSemesterId) {
				try {
					const result = await getSubjects(selectedSemesterId);
					if (result.success && result.data) {
						setSubjects(result.data);
					}
				} catch (error) {
					console.error("Failed to load subjects:", error);
				}
			} else {
				setSubjects([]);
			}
			setSelectedSubjectId("");
		}
		loadSubjects();
	}, [selectedSemesterId]);

	const uploadTypes = [
		{
			type: "syllabus" as UploadType,
			label: "Syllabus",
			description: "Upload course syllabus PDF",
			icon: BookOpen,
			color: "pink",
		},
		{
			type: "exam" as UploadType,
			label: "Exam Paper",
			description: "Upload past exam papers",
			icon: FileQuestion,
			color: "cyan",
		},
		{
			type: "notes" as UploadType,
			label: "Lecture Notes",
			description: "Upload lecture notes",
			icon: FileText,
			color: "purple",
		},
	];

	const onDrop = useCallback((acceptedFiles: File[]) => {
		if (acceptedFiles.length > 0) {
			setUploadState({
				file: acceptedFiles[0],
				status: "idle",
				message: "",
			});
		}
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"application/pdf": [".pdf"],
		},
		maxFiles: 1,
	});

	async function handleUpload() {
		if (!uploadState.file) return;

		// Validate required fields based on upload type
		if (uploadType === "syllabus") {
			if (!selectedSemesterId || !selectedSubjectId) {
				setUploadState((prev) => ({
					...prev,
					status: "error",
					message: "Please select academic year, semester, and subject",
				}));
				return;
			}
		}

		if (uploadType === "exam") {
			if (!selectedSemesterId || !selectedSubjectId || !examType) {
				setUploadState((prev) => ({
					...prev,
					status: "error",
					message:
						"Please select academic year, semester, subject, and exam type",
				}));
				return;
			}
		}

		setUploadState((prev) => ({
			...prev,
			status: "uploading",
			message: "Uploading file...",
		}));

		try {
			const formData = new FormData();
			formData.append("file", uploadState.file);
			formData.append("type", uploadType);
			formData.append("semesterId", selectedSemesterId);
			formData.append("subjectId", selectedSubjectId);

			if (uploadType === "exam") {
				formData.append("examType", examType);
			}

			// Simulate processing with Gemini
			await new Promise((resolve) => setTimeout(resolve, 1500));
			setUploadState((prev) => ({
				...prev,
				status: "processing",
				message: "Processing with AI...",
			}));

			// Call your upload API
			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			const result = await response.json();

			if (response.ok) {
				setUploadState({
					file: null,
					status: "success",
					message: `Successfully processed ${uploadType}!`,
				});
				// Reset selections
				setSelectedCourseId("");
				setSelectedBatchId("");
				setSelectedSemesterId("");
				setSelectedSubjectId("");
				setExamType("");
			} else {
				throw new Error(result.error || "Upload failed");
			}
		} catch (error: any) {
			setUploadState((prev) => ({
				...prev,
				status: "error",
				message: error.message || "Something went wrong",
			}));
		}
	}

	function resetUpload() {
		setUploadState({
			file: null,
			status: "idle",
			message: "",
		});
	}

	const colorClasses: Record<string, string> = {
		pink: "from-pink-500/20 to-pink-500/5 border-pink-500/30 text-pink-400",
		cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400",
		purple:
			"from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400",
	};

	return (
		<div className="max-w-4xl mx-auto space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-white">Upload Content</h1>
				<p className="text-gray-400 text-sm">
					Upload syllabi, exam papers, or lecture notes for AI processing
				</p>
			</div>

			{/* Upload Type Selection */}
			<div className="grid sm:grid-cols-3 gap-4">
				{uploadTypes.map((type) => (
					<motion.button
						key={type.type}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						onClick={() => setUploadType(type.type)}
						className={`p-4 rounded-2xl border text-left transition-all ${
							uploadType === type.type
								? `bg-gradient-to-b ${colorClasses[type.color]}`
								: "border-white/10 hover:border-white/20 hover:bg-white/5"
						}`}
					>
						<type.icon
							className={`w-8 h-8 mb-3 ${
								uploadType === type.type ? "" : "text-gray-500"
							}`}
						/>
						<h3
							className={`font-semibold mb-1 ${
								uploadType === type.type ? "text-white" : "text-gray-300"
							}`}
						>
							{type.label}
						</h3>
						<p
							className={`text-sm ${
								uploadType === type.type ? "text-gray-300" : "text-gray-500"
							}`}
						>
							{type.description}
						</p>
					</motion.button>
				))}
			</div>

			{/* Selection Forms */}
			{(uploadType === "syllabus" || uploadType === "exam") && (
				<div className="card p-6 space-y-4">
					<h3 className="text-lg font-semibold text-white flex items-center gap-2">
						<GraduationCap className="w-5 h-5 text-violet-400" />
						Select Details
					</h3>

					<div className="grid sm:grid-cols-2 gap-4">
						{/* Course */}
						<div className="space-y-2">
							<label className="text-sm text-gray-400 flex items-center gap-2">
								<BookOpen className="w-4 h-4" />
								Course
							</label>
							<select
								value={selectedCourseId}
								onChange={(e) => setSelectedCourseId(e.target.value)}
								className="select"
								disabled={loading}
							>
								<option value="">Select Course</option>
								{courses.map((course) => (
									<option key={course.id} value={course.id}>
										{course.code} - {course.name}
									</option>
								))}
							</select>
						</div>

						{/* Batch */}
						<div className="space-y-2">
							<label className="text-sm text-gray-400 flex items-center gap-2">
								<Users className="w-4 h-4" />
								Batch
							</label>
							<select
								value={selectedBatchId}
								onChange={(e) => setSelectedBatchId(e.target.value)}
								className="select"
								disabled={!selectedCourseId || batches.length === 0}
							>
								<option value="">Select Batch</option>
								{batches.map((batch) => (
									<option key={batch.id} value={batch.id}>
										{batch.startYear} - {batch.endYear}
									</option>
								))}
							</select>
						</div>

						{/* Semester */}
						<div className="space-y-2">
							<label className="text-sm text-gray-400 flex items-center gap-2">
								<GraduationCap className="w-4 h-4" />
								Semester
							</label>
							<select
								value={selectedSemesterId}
								onChange={(e) => setSelectedSemesterId(e.target.value)}
								className="select"
								disabled={!selectedBatchId || semesters.length === 0}
							>
								<option value="">Select Semester</option>
								{semesters.map((sem) => (
									<option key={sem.id} value={sem.id}>
										Semester {sem.number} (Year {Math.ceil(sem.number / 2)})
									</option>
								))}
							</select>
						</div>

						{/* Subject */}
						<div className="space-y-2">
							<label className="text-sm text-gray-400 flex items-center gap-2">
								<BookMarked className="w-4 h-4" />
								Subject
							</label>
							<select
								value={selectedSubjectId}
								onChange={(e) => setSelectedSubjectId(e.target.value)}
								className="select"
								disabled={!selectedSemesterId || subjects.length === 0}
							>
								<option value="">Select Subject</option>
								{subjects.map((subject) => (
									<option key={subject.id} value={subject.id}>
										{subject.code} - {subject.name}
									</option>
								))}
							</select>
						</div>

						{/* Exam Type (only for exam uploads) */}
						{uploadType === "exam" && (
							<div className="space-y-2 sm:col-span-2">
								<label className="text-sm text-gray-400 flex items-center gap-2">
									<FileQuestion className="w-4 h-4" />
									Exam Type
								</label>
								<select
									value={examType}
									onChange={(e) => setExamType(e.target.value)}
									className="select"
								>
									<option value="">Select Exam Type</option>
									<option value="MIDTERM_1">Midterm 1</option>
									<option value="MIDTERM_2">Midterm 2</option>
									<option value="END_TERM">End Term</option>
								</select>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Upload Area */}
			<div className="card p-8">
				{uploadState.status === "success" ? (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="text-center py-8"
					>
						<div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
							<CheckCircle className="w-8 h-8 text-green-400" />
						</div>
						<h3 className="text-xl font-semibold text-white mb-2">
							Upload Complete!
						</h3>
						<p className="text-gray-400 mb-6">{uploadState.message}</p>
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={resetUpload}
							className="btn-primary"
						>
							Upload Another File
						</motion.button>
					</motion.div>
				) : uploadState.status === "error" ? (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="text-center py-8"
					>
						<div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
							<AlertCircle className="w-8 h-8 text-red-400" />
						</div>
						<h3 className="text-xl font-semibold text-white mb-2">
							Upload Failed
						</h3>
						<p className="text-red-400 mb-6">{uploadState.message}</p>
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={resetUpload}
							className="btn-primary"
						>
							Try Again
						</motion.button>
					</motion.div>
				) : uploadState.file ? (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="space-y-6"
					>
						{/* File Preview */}
						<div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
							<div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
								<FileText className="w-6 h-6 text-red-400" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-white font-medium truncate">
									{uploadState.file.name}
								</p>
								<p className="text-gray-500 text-sm">
									{(uploadState.file.size / 1024 / 1024).toFixed(2)} MB
								</p>
							</div>
							<button
								onClick={resetUpload}
								className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Processing Status */}
						{(uploadState.status === "uploading" ||
							uploadState.status === "processing") && (
							<div className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
								<Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
								<span className="text-purple-300">{uploadState.message}</span>
							</div>
						)}

						{/* Upload Button */}
						{uploadState.status === "idle" && (
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={handleUpload}
								className="btn-primary w-full flex items-center justify-center gap-2"
							>
								<Sparkles className="w-5 h-5" />
								Process with AI
							</motion.button>
						)}
					</motion.div>
				) : (
					<div
						{...getRootProps()}
						className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
							isDragActive
								? "border-purple-500 bg-purple-500/10"
								: "border-white/20 hover:border-purple-500/50 hover:bg-white/5"
						}`}
					>
						<input {...getInputProps()} />

						<div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
							<Upload className="w-8 h-8 text-purple-400" />
						</div>

						<h3 className="text-lg font-semibold text-white mb-2">
							{isDragActive ? "Drop your file here" : "Drag & drop your PDF"}
						</h3>
						<p className="text-gray-500 mb-4">or click to browse</p>
						<span className="badge-purple text-sm">PDF files only</span>
					</div>
				)}
			</div>

			{/* Instructions */}
			<div className="card p-6">
				<h3 className="text-lg font-semibold text-white mb-4">
					Upload Instructions
				</h3>
				<div className="space-y-4 text-sm">
					<div className="flex items-start gap-3">
						<div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
							<span className="text-purple-400 text-xs font-semibold">1</span>
						</div>
						<div>
							<p className="text-white font-medium">Select upload type</p>
							<p className="text-gray-500">
								Choose whether you're uploading a syllabus, exam paper, or
								lecture notes.
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3">
						<div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
							<span className="text-purple-400 text-xs font-semibold">2</span>
						</div>
						<div>
							<p className="text-white font-medium">Upload your PDF</p>
							<p className="text-gray-500">
								Drag and drop or click to select your PDF file.
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3">
						<div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
							<span className="text-purple-400 text-xs font-semibold">3</span>
						</div>
						<div>
							<p className="text-white font-medium">AI Processing</p>
							<p className="text-gray-500">
								Our AI will extract and structure the content automatically.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
