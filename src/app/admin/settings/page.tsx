"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
	Building2,
	GraduationCap,
	Calendar,
	Plus,
	Trash2,
	Loader2,
	CheckCircle,
	AlertCircle,
	ChevronDown,
	ChevronRight,
	BookOpen,
	Users,
} from "lucide-react";
import {
	getCollege,
	updateCollege,
	getCourses,
	createCourse,
	deleteCourse,
	getBatches,
	createBatch,
	deleteBatch,
	getSemesters,
} from "../actions";

interface College {
	id: string;
	name: string;
	code: string;
	location: string | null;
}

interface Course {
	id: string;
	name: string;
	code: string;
	duration: number;
	description: string | null;
	_count: { batches: number };
}

interface Batch {
	id: string;
	startYear: number;
	endYear: number;
	courseId: string;
	isActive: boolean;
	course: { name: string; code: string };
	_count: { semesters: number };
}

interface Semester {
	id: string;
	number: number;
	batchId: string;
	_count: { subjects: number; exams: number };
}

export default function SettingsPage() {
	const [college, setCollege] = useState<College | null>(null);
	const [courses, setCourses] = useState<Course[]>([]);
	const [batches, setBatches] = useState<Batch[]>([]);
	const [loading, setLoading] = useState(true);

	// Expanded states
	const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
		new Set()
	);
	const [expandedBatches, setExpandedBatches] = useState<Set<string>>(
		new Set()
	);
	const [batchSemesters, setBatchSemesters] = useState<
		Record<string, Semester[]>
	>({});

	// Form states
	const [collegeName, setCollegeName] = useState("");
	const [collegeCode, setCollegeCode] = useState("");
	const [collegeLocation, setCollegeLocation] = useState("");

	// New course form
	const [showCourseForm, setShowCourseForm] = useState(false);
	const [newCourseName, setNewCourseName] = useState("");
	const [newCourseCode, setNewCourseCode] = useState("");
	const [newCourseDuration, setNewCourseDuration] = useState(3);
	const [newCourseDescription, setNewCourseDescription] = useState("");

	// New batch form
	const [selectedCourseForBatch, setSelectedCourseForBatch] =
		useState<string>("");
	const [newBatchYear, setNewBatchYear] = useState(new Date().getFullYear());

	// Action states
	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	useEffect(() => {
		loadData();
	}, []);

	async function loadData() {
		try {
			const [collegeResult, coursesResult, batchesResult] = await Promise.all([
				getCollege(),
				getCourses(),
				getBatches(),
			]);

			if (collegeResult.success && collegeResult.data) {
				setCollege(collegeResult.data);
				setCollegeName(collegeResult.data.name);
				setCollegeCode(collegeResult.data.code);
				setCollegeLocation(collegeResult.data.location || "");
			}

			if (coursesResult.success && coursesResult.data) {
				setCourses(coursesResult.data);
			}

			if (batchesResult.success && batchesResult.data) {
				setBatches(batchesResult.data);
			}
		} catch (error) {
			console.error("Failed to load data:", error);
		} finally {
			setLoading(false);
		}
	}

	function showMessage(type: "success" | "error", text: string) {
		setMessage({ type, text });
		setTimeout(() => setMessage(null), 3000);
	}

	async function toggleBatch(batchId: string) {
		if (expandedBatches.has(batchId)) {
			setExpandedBatches((prev) => {
				const next = new Set(prev);
				next.delete(batchId);
				return next;
			});
		} else {
			// Load semesters if not already loaded
			if (!batchSemesters[batchId]) {
				const result = await getSemesters(batchId);
				if (result.success && result.data) {
					setBatchSemesters((prev) => ({ ...prev, [batchId]: result.data }));
				}
			}
			setExpandedBatches((prev) => new Set(prev).add(batchId));
		}
	}

	async function handleUpdateCollege(e: React.FormEvent) {
		e.preventDefault();
		setActionLoading("updateCollege");

		try {
			const formData = new FormData();
			formData.append("name", collegeName);
			formData.append("code", collegeCode);
			formData.append("location", collegeLocation);

			const result = await updateCollege(formData);
			if (result.success) {
				showMessage("success", "College information updated");
				await loadData();
			} else {
				showMessage("error", result.error || "Failed to update college");
			}
		} catch (error) {
			showMessage("error", "Failed to update college");
		} finally {
			setActionLoading(null);
		}
	}

	async function handleCreateCourse(e: React.FormEvent) {
		e.preventDefault();
		setActionLoading("createCourse");

		try {
			const formData = new FormData();
			formData.append("name", newCourseName);
			formData.append("code", newCourseCode);
			formData.append("duration", newCourseDuration.toString());
			formData.append("description", newCourseDescription);

			const result = await createCourse(formData);
			if (result.success) {
				showMessage("success", `Course ${newCourseCode} created`);
				setShowCourseForm(false);
				setNewCourseName("");
				setNewCourseCode("");
				setNewCourseDuration(3);
				setNewCourseDescription("");
				await loadData();
			} else {
				showMessage("error", result.error || "Failed to create course");
			}
		} catch (error) {
			showMessage("error", "Failed to create course");
		} finally {
			setActionLoading(null);
		}
	}

	async function handleDeleteCourse(id: string, code: string) {
		if (
			!confirm(
				`Delete course ${code}? This will delete all batches, subjects, and data.`
			)
		) {
			return;
		}

		setActionLoading(`deleteCourse-${id}`);
		try {
			const result = await deleteCourse(id);
			if (result.success) {
				showMessage("success", `Course ${code} deleted`);
				await loadData();
			} else {
				showMessage("error", result.error || "Failed to delete course");
			}
		} catch (error) {
			showMessage("error", "Failed to delete course");
		} finally {
			setActionLoading(null);
		}
	}

	async function handleCreateBatch() {
		if (!selectedCourseForBatch) {
			showMessage("error", "Please select a course");
			return;
		}

		setActionLoading("createBatch");
		try {
			const result = await createBatch(selectedCourseForBatch, newBatchYear);
			if (result.success) {
				const course = courses.find((c) => c.id === selectedCourseForBatch);
				showMessage(
					"success",
					`Batch ${newBatchYear}-${
						newBatchYear + (course?.duration || 3)
					} created with ${(course?.duration || 3) * 2} semesters`
				);
				setSelectedCourseForBatch("");
				await loadData();
			} else {
				showMessage("error", result.error || "Failed to create batch");
			}
		} catch (error) {
			showMessage("error", "Failed to create batch");
		} finally {
			setActionLoading(null);
		}
	}

	async function handleDeleteBatch(id: string, batch: Batch) {
		if (
			!confirm(
				`Delete batch ${batch.course.code} ${batch.startYear}-${batch.endYear}? This will delete all subjects, exams, and data.`
			)
		) {
			return;
		}

		setActionLoading(`deleteBatch-${id}`);
		try {
			const result = await deleteBatch(id);
			if (result.success) {
				showMessage("success", `Batch deleted`);
				await loadData();
			} else {
				showMessage("error", result.error || "Failed to delete batch");
			}
		} catch (error) {
			showMessage("error", "Failed to delete batch");
		} finally {
			setActionLoading(null);
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-white">Settings</h1>
				<p className="text-gray-400 text-sm">
					Manage college, courses, and batches
				</p>
			</div>

			{/* Message Toast */}
			{message && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0 }}
					className={`p-4 rounded-xl flex items-center gap-3 ${
						message.type === "success"
							? "bg-green-500/20 border border-green-500/30 text-green-300"
							: "bg-red-500/20 border border-red-500/30 text-red-300"
					}`}
				>
					{message.type === "success" ? (
						<CheckCircle className="w-5 h-5" />
					) : (
						<AlertCircle className="w-5 h-5" />
					)}
					{message.text}
				</motion.div>
			)}

			{/* College Information */}
			<div className="card p-6">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Building2 className="w-5 h-5 text-violet-400" />
					College Information
				</h2>

				<form onSubmit={handleUpdateCollege} className="space-y-4">
					<div className="grid sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm text-gray-400">College Name</label>
							<input
								type="text"
								value={collegeName}
								onChange={(e) => setCollegeName(e.target.value)}
								className="input"
								placeholder="e.g., Amity University Patna"
								required
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm text-gray-400">College Code</label>
							<input
								type="text"
								value={collegeCode}
								onChange={(e) => setCollegeCode(e.target.value)}
								className="input"
								placeholder="e.g., AUP"
								required
							/>
						</div>
					</div>
					<div className="space-y-2">
						<label className="text-sm text-gray-400">Location</label>
						<input
							type="text"
							value={collegeLocation}
							onChange={(e) => setCollegeLocation(e.target.value)}
							className="input"
							placeholder="e.g., Patna, Bihar, India"
						/>
					</div>
					<button
						type="submit"
						disabled={actionLoading === "updateCollege"}
						className="btn-primary"
					>
						{actionLoading === "updateCollege" ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin mr-2" />
								Saving...
							</>
						) : (
							"Save College Info"
						)}
					</button>
				</form>
			</div>

			{/* Courses */}
			<div className="card p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-white flex items-center gap-2">
						<GraduationCap className="w-5 h-5 text-violet-400" />
						Courses (Degree Programs)
					</h2>
					<button
						onClick={() => setShowCourseForm(!showCourseForm)}
						className="btn-primary text-sm py-2 px-3"
					>
						<Plus className="w-4 h-4 mr-1" />
						Add Course
					</button>
				</div>

				{/* New Course Form */}
				{showCourseForm && (
					<motion.form
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						onSubmit={handleCreateCourse}
						className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 space-y-4"
					>
						<div className="grid sm:grid-cols-3 gap-4">
							<div className="space-y-2">
								<label className="text-sm text-gray-400">Course Code</label>
								<input
									type="text"
									value={newCourseCode}
									onChange={(e) =>
										setNewCourseCode(e.target.value.toUpperCase())
									}
									className="input"
									placeholder="e.g., BCA"
									required
								/>
							</div>
							<div className="space-y-2 sm:col-span-2">
								<label className="text-sm text-gray-400">Course Name</label>
								<input
									type="text"
									value={newCourseName}
									onChange={(e) => setNewCourseName(e.target.value)}
									className="input"
									placeholder="e.g., Bachelor of Computer Applications"
									required
								/>
							</div>
						</div>
						<div className="grid sm:grid-cols-3 gap-4">
							<div className="space-y-2">
								<label className="text-sm text-gray-400">
									Duration (Years)
								</label>
								<select
									value={newCourseDuration}
									onChange={(e) =>
										setNewCourseDuration(parseInt(e.target.value))
									}
									className="select"
								>
									<option value={2}>2 Years (4 Semesters)</option>
									<option value={3}>3 Years (6 Semesters)</option>
									<option value={4}>4 Years (8 Semesters)</option>
									<option value={5}>5 Years (10 Semesters)</option>
								</select>
							</div>
							<div className="space-y-2 sm:col-span-2">
								<label className="text-sm text-gray-400">Description</label>
								<input
									type="text"
									value={newCourseDescription}
									onChange={(e) => setNewCourseDescription(e.target.value)}
									className="input"
									placeholder="Optional description"
								/>
							</div>
						</div>
						<div className="flex gap-2">
							<button
								type="submit"
								disabled={actionLoading === "createCourse"}
								className="btn-primary"
							>
								{actionLoading === "createCourse" ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									"Create Course"
								)}
							</button>
							<button
								type="button"
								onClick={() => setShowCourseForm(false)}
								className="btn-secondary"
							>
								Cancel
							</button>
						</div>
					</motion.form>
				)}

				{/* Courses List */}
				<div className="space-y-3">
					{courses.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							No courses yet. Click "Add Course" to create one.
						</div>
					) : (
						courses.map((course) => (
							<div
								key={course.id}
								className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
							>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
										<BookOpen className="w-5 h-5 text-violet-400" />
									</div>
									<div>
										<div className="flex items-center gap-2">
											<span className="text-white font-medium">
												{course.code}
											</span>
											<span className="badge-purple text-xs">
												{course.duration}yr ({course.duration * 2} sem)
											</span>
										</div>
										<p className="text-gray-400 text-sm">{course.name}</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-gray-500 text-sm">
										{course._count.batches} batches
									</span>
									<button
										onClick={() => handleDeleteCourse(course.id, course.code)}
										disabled={actionLoading === `deleteCourse-${course.id}`}
										className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
									>
										{actionLoading === `deleteCourse-${course.id}` ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Trash2 className="w-4 h-4" />
										)}
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</div>

			{/* Batches */}
			<div className="card p-6">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Users className="w-5 h-5 text-violet-400" />
					Batches (Student Groups by Year)
				</h2>

				{/* Create Batch */}
				{courses.length > 0 && (
					<div className="flex flex-wrap items-end gap-3 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
						<div className="space-y-2">
							<label className="text-sm text-gray-400">Course</label>
							<select
								value={selectedCourseForBatch}
								onChange={(e) => setSelectedCourseForBatch(e.target.value)}
								className="select"
							>
								<option value="">Select Course</option>
								{courses.map((course) => (
									<option key={course.id} value={course.id}>
										{course.code} - {course.name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<label className="text-sm text-gray-400">Start Year</label>
							<input
								type="number"
								value={newBatchYear}
								onChange={(e) => setNewBatchYear(parseInt(e.target.value))}
								className="input w-28"
								min={2000}
								max={2100}
							/>
						</div>
						<button
							onClick={handleCreateBatch}
							disabled={
								actionLoading === "createBatch" || !selectedCourseForBatch
							}
							className="btn-primary"
						>
							{actionLoading === "createBatch" ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<>
									<Plus className="w-4 h-4 mr-1" />
									Create Batch
								</>
							)}
						</button>
					</div>
				)}

				{/* Batches List */}
				<div className="space-y-3">
					{batches.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							{courses.length === 0
								? "Create a course first, then add batches."
								: "No batches yet. Select a course and create a batch above."}
						</div>
					) : (
						batches.map((batch) => (
							<div
								key={batch.id}
								className="border border-white/10 rounded-xl overflow-hidden"
							>
								{/* Batch Header */}
								<div
									className="flex items-center justify-between p-4 bg-white/5 cursor-pointer hover:bg-white/[0.08] transition-colors"
									onClick={() => toggleBatch(batch.id)}
								>
									<div className="flex items-center gap-3">
										{expandedBatches.has(batch.id) ? (
											<ChevronDown className="w-5 h-5 text-gray-400" />
										) : (
											<ChevronRight className="w-5 h-5 text-gray-400" />
										)}
										<Calendar className="w-5 h-5 text-violet-400" />
										<div>
											<span className="text-white font-medium">
												{batch.course.code} {batch.startYear}-{batch.endYear}
											</span>
											<span className="badge-purple ml-2">
												{batch._count.semesters} semesters
											</span>
										</div>
									</div>
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteBatch(batch.id, batch);
										}}
										disabled={actionLoading === `deleteBatch-${batch.id}`}
										className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
									>
										{actionLoading === `deleteBatch-${batch.id}` ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Trash2 className="w-4 h-4" />
										)}
									</button>
								</div>

								{/* Semesters */}
								{expandedBatches.has(batch.id) && (
									<div className="p-4 border-t border-white/10">
										<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
											{batchSemesters[batch.id]?.map((sem) => (
												<div
													key={sem.id}
													className="p-3 rounded-lg bg-white/5 border border-white/10"
												>
													<div className="flex items-center gap-2 mb-1">
														<GraduationCap className="w-4 h-4 text-violet-400" />
														<span className="text-white text-sm font-medium">
															Semester {sem.number}
														</span>
													</div>
													<div className="text-xs text-gray-500">
														Year {Math.ceil(sem.number / 2)} •{" "}
														{sem.number % 2 === 1 ? "Odd" : "Even"}
													</div>
													<div className="text-xs text-gray-400 mt-1">
														{sem._count.subjects} subjects
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						))
					)}
				</div>
			</div>

			{/* Quick Setup Guide */}
			<div className="card p-6">
				<h2 className="text-lg font-semibold text-white mb-4">How It Works</h2>
				<div className="space-y-4 text-sm">
					<div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
						<p className="text-violet-300 font-medium mb-2">Structure:</p>
						<p className="text-gray-400">
							<strong className="text-white">Course</strong> (BCA, BTech) →{" "}
							<strong className="text-white">Batch</strong> (2024-2027) →{" "}
							<strong className="text-white">Semester</strong> (1-6) →{" "}
							<strong className="text-white">Subjects</strong> → Syllabus,
							Exams, Questions
						</p>
					</div>

					<div className="flex items-start gap-3">
						<div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
							<span className="text-violet-400 text-xs font-semibold">1</span>
						</div>
						<div>
							<p className="text-white font-medium">Create a Course</p>
							<p className="text-gray-500">
								Add degree programs like BCA (3 years) or BTech (4 years).
							</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
							<span className="text-violet-400 text-xs font-semibold">2</span>
						</div>
						<div>
							<p className="text-white font-medium">Create a Batch</p>
							<p className="text-gray-500">
								Add student batches like BCA 2024-2027. Semesters are
								auto-created.
							</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
							<span className="text-violet-400 text-xs font-semibold">3</span>
						</div>
						<div>
							<p className="text-white font-medium">Add Subjects</p>
							<p className="text-gray-500">
								Go to Subjects page to add subjects to each semester.
							</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
							<span className="text-violet-400 text-xs font-semibold">4</span>
						</div>
						<div>
							<p className="text-white font-medium">Upload Content</p>
							<p className="text-gray-500">
								Upload syllabi, exam papers, and notes for each subject.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
