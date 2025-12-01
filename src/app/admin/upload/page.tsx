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
	AlertTriangle,
	RefreshCw,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { getCourses, getBatches, getSemesters, getSubjects } from "../actions";

type UploadType = "syllabus" | "exam" | "notes";

interface DuplicateInfo {
	isDuplicate: boolean;
	duplicateType: "exact_file" | "same_subject" | "similar_content";
	existingSyllabus: {
		id: string;
		subjectId: string;
		subjectName: string;
		subjectCode: string;
		version: string;
		uploadedAt: string;
		modulesCount: number;
	};
	canReplace: boolean;
	message: string;
}

interface UploadState {
	file: File | null;
	status:
		| "idle"
		| "uploading"
		| "processing"
		| "success"
		| "error"
		| "duplicate";
	message: string;
	extractionData?: {
		extractedModules?: number;
		extractedTopics?: number;
		extractedBooks?: number;
		extractedQuestions?: number;
		extractionError?: string;
	};
	duplicateInfo?: DuplicateInfo;
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
		extractionData: undefined,
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
	const [academicYear, setAcademicYear] = useState<string>("");
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

	async function handleUpload(forceReplace = false) {
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
			if (
				!selectedSemesterId ||
				!selectedSubjectId ||
				!examType ||
				!academicYear
			) {
				setUploadState((prev) => ({
					...prev,
					status: "error",
					message:
						"Please select academic year, semester, subject, exam type, and paper year",
				}));
				return;
			}
		}

		setUploadState((prev) => ({
			...prev,
			status: "uploading",
			message: "Uploading file...",
			duplicateInfo: undefined,
		}));

		try {
			const formData = new FormData();
			formData.append("file", uploadState.file);
			formData.append("type", uploadType);
			formData.append("semesterId", selectedSemesterId);
			formData.append("subjectId", selectedSubjectId);

			if (uploadType === "exam") {
				formData.append("examType", examType);
				formData.append("academicYear", academicYear);
			}

			// If user confirmed replacement, add forceReplace flag
			if (forceReplace) {
				formData.append("forceReplace", "true");
			}

			setUploadState((prev) => ({
				...prev,
				status: "processing",
				message: "Processing with AI... This may take a moment.",
			}));

			// Call your upload API
			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			const result = await response.json();

			// Handle duplicate response (409 Conflict)
			if (response.status === 409 && result.isDuplicate) {
				setUploadState((prev) => ({
					...prev,
					status: "duplicate",
					message: result.message,
					duplicateInfo: {
						isDuplicate: true,
						duplicateType: result.duplicateType,
						existingSyllabus: result.existingSyllabus,
						canReplace: result.canReplace || false,
						message: result.message,
					},
				}));
				return;
			}

			if (response.ok && result.success) {
				const extractionData = result.data;

				// Check if there was an extraction error but PDF was still saved
				if (extractionData?.extractionError) {
					setUploadState({
						file: null,
						status: "success",
						message: `PDF saved! AI extraction had issues: ${extractionData.extractionError}`,
						extractionData: {
							extractionError: extractionData.extractionError,
						},
					});
				} else {
					setUploadState({
						file: null,
						status: "success",
						message: result.data?.wasReplaced
							? `Successfully replaced ${uploadType}!`
							: `Successfully processed ${uploadType}!`,
						extractionData: {
							extractedModules: extractionData?.extractedModules,
							extractedTopics: extractionData?.extractedTopics,
							extractedBooks: extractionData?.extractedBooks,
							extractedQuestions: extractionData?.questionsCount,
						},
					});
				}
				// Reset selections
				setSelectedCourseId("");
				setSelectedBatchId("");
				setSelectedSemesterId("");
				setSelectedSubjectId("");
				setExamType("");
				setAcademicYear("");
			} else {
				throw new Error(result.error || "Upload failed");
			}
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Something went wrong";
			setUploadState((prev) => ({
				...prev,
				status: "error",
				message: errorMessage,
			}));
		}
	}

	function resetUpload() {
		setUploadState({
			file: null,
			status: "idle",
			message: "",
			extractionData: undefined,
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
							<>
								<div className="space-y-2">
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

								<div className="space-y-2">
									<label className="text-sm text-gray-400 flex items-center gap-2">
										<GraduationCap className="w-4 h-4" />
										Paper Year
									</label>
									<select
										value={academicYear}
										onChange={(e) => setAcademicYear(e.target.value)}
										className="select"
									>
										<option value="">Select Year</option>
										<option value="2025-2026">2025-2026</option>
										<option value="2024-2025">2024-2025</option>
										<option value="2023-2024">2023-2024</option>
										<option value="2022-2023">2022-2023</option>
										<option value="2021-2022">2021-2022</option>
										<option value="2020-2021">2020-2021</option>
									</select>
								</div>
							</>
						)}
					</div>
				</div>
			)}

			{/* Upload Area */}
			<div className="card p-8">
				{uploadState.status === "duplicate" ? (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="text-center py-8"
					>
						<div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
							<AlertTriangle className="w-8 h-8 text-yellow-400" />
						</div>
						<h3 className="text-xl font-semibold text-white mb-2">
							{uploadState.duplicateInfo?.duplicateType === "exact_file"
								? "Duplicate File Detected"
								: uploadState.duplicateInfo?.duplicateType === "same_subject"
								? "Syllabus Already Exists"
								: "Content Mismatch Warning"}
						</h3>
						<p className="text-gray-400 mb-4 max-w-md mx-auto">
							{uploadState.message}
						</p>

						{/* Existing syllabus info */}
						{uploadState.duplicateInfo?.existingSyllabus && (
							<div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
								<p className="text-gray-400 text-sm mb-2">Existing Syllabus:</p>
								<div className="space-y-1">
									<p className="text-white font-medium">
										{uploadState.duplicateInfo.existingSyllabus.subjectName}
									</p>
									<p className="text-gray-500 text-sm">
										Code:{" "}
										{uploadState.duplicateInfo.existingSyllabus.subjectCode}
									</p>
									<p className="text-gray-500 text-sm">
										Version:{" "}
										{uploadState.duplicateInfo.existingSyllabus.version}
									</p>
									<p className="text-gray-500 text-sm">
										Modules:{" "}
										{uploadState.duplicateInfo.existingSyllabus.modulesCount}
									</p>
									<p className="text-gray-500 text-sm">
										Uploaded:{" "}
										{new Date(
											uploadState.duplicateInfo.existingSyllabus.uploadedAt
										).toLocaleDateString()}
									</p>
								</div>
							</div>
						)}

						<div className="flex justify-center gap-3">
							{uploadState.duplicateInfo?.canReplace && (
								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={() => handleUpload(true)}
									className="btn-primary flex items-center gap-2"
								>
									<RefreshCw className="w-4 h-4" />
									Replace Existing
								</motion.button>
							)}
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={resetUpload}
								className="px-6 py-2.5 rounded-xl bg-gray-700 text-white hover:bg-gray-600 transition-colors"
							>
								Cancel
							</motion.button>
						</div>
					</motion.div>
				) : uploadState.status === "success" ? (
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
						<p className="text-gray-400 mb-4">{uploadState.message}</p>

						{/* Show extraction stats if available */}
						{uploadState.extractionData &&
							!uploadState.extractionData.extractionError && (
								<div className="flex justify-center gap-4 mb-6">
									{uploadState.extractionData.extractedModules !==
										undefined && (
										<div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-2">
											<p className="text-violet-400 text-2xl font-bold">
												{uploadState.extractionData.extractedModules}
											</p>
											<p className="text-gray-500 text-xs">Modules</p>
										</div>
									)}
									{uploadState.extractionData.extractedTopics !== undefined && (
										<div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2">
											<p className="text-cyan-400 text-2xl font-bold">
												{uploadState.extractionData.extractedTopics}
											</p>
											<p className="text-gray-500 text-xs">Topics</p>
										</div>
									)}
									{uploadState.extractionData.extractedBooks !== undefined && (
										<div className="bg-pink-500/10 border border-pink-500/20 rounded-xl px-4 py-2">
											<p className="text-pink-400 text-2xl font-bold">
												{uploadState.extractionData.extractedBooks}
											</p>
											<p className="text-gray-500 text-xs">Books</p>
										</div>
									)}
									{uploadState.extractionData.extractedQuestions !==
										undefined && (
										<div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
											<p className="text-amber-400 text-2xl font-bold">
												{uploadState.extractionData.extractedQuestions}
											</p>
											<p className="text-gray-500 text-xs">Questions</p>
										</div>
									)}
								</div>
							)}

						{/* Show warning if extraction failed */}
						{uploadState.extractionData?.extractionError && (
							<div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 text-left">
								<div className="flex items-start gap-3">
									<AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
									<div>
										<p className="text-yellow-400 font-medium">
											AI Extraction Warning
										</p>
										<p className="text-gray-400 text-sm mt-1">
											Your PDF was saved but AI couldn't extract the content.
											You can try uploading again or manually add the syllabus
											content.
										</p>
									</div>
								</div>
							</div>
						)}

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
								onClick={() => handleUpload(false)}
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
