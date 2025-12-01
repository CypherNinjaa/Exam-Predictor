"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Plus,
	Search,
	Edit2,
	Trash2,
	BookOpen,
	X,
	Loader2,
	FileText,
	GraduationCap,
} from "lucide-react";
import {
	getSubjects,
	createSubject,
	updateSubject,
	deleteSubject,
} from "../actions";

interface Subject {
	id: string;
	code: string;
	name: string;
	credits: number;
	collegeId: string;
	_count: {
		syllabi: number;
		offerings: number;
	};
}

export default function SubjectsPage() {
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState("");

	useEffect(() => {
		fetchSubjects();
	}, []);

	async function fetchSubjects() {
		const result = await getSubjects();
		if (result.success && result.data) {
			setSubjects(result.data);
		}
		setLoading(false);
	}

	const filteredSubjects = subjects.filter(
		(s) =>
			s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.code.toLowerCase().includes(searchQuery.toLowerCase())
	);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");

		const formData = new FormData(e.currentTarget);

		startTransition(async () => {
			let result;
			if (editingSubject) {
				result = await updateSubject(editingSubject.id, formData);
			} else {
				result = await createSubject(formData);
			}

			if (result.success) {
				setIsModalOpen(false);
				setEditingSubject(null);
				fetchSubjects();
			} else {
				setError(result.error || "Something went wrong");
			}
		});
	}

	async function handleDelete(id: string) {
		if (!confirm("Are you sure you want to delete this subject?")) return;

		startTransition(async () => {
			const result = await deleteSubject(id);
			if (result.success) {
				fetchSubjects();
			}
		});
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-white">Subjects</h1>
					<p className="text-gray-400 text-sm">
						Manage all subjects in the system
					</p>
				</div>

				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={() => {
						setEditingSubject(null);
						setIsModalOpen(true);
					}}
					className="btn-primary flex items-center gap-2"
				>
					<Plus className="w-4 h-4" />
					Add Subject
				</motion.button>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
				<input
					type="text"
					placeholder="Search subjects..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="input w-full pl-12"
				/>
			</div>

			{/* Subjects Grid */}
			{loading ? (
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{[...Array(6)].map((_, i) => (
						<div
							key={i}
							className="h-48 bg-white/5 rounded-2xl animate-pulse"
						/>
					))}
				</div>
			) : filteredSubjects.length === 0 ? (
				<div className="text-center py-16">
					<BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-400">
						No subjects found
					</h3>
					<p className="text-gray-500 text-sm">
						{searchQuery
							? "Try a different search term"
							: "Add your first subject to get started"}
					</p>
				</div>
			) : (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
				>
					{filteredSubjects.map((subject, index) => (
						<motion.div
							key={subject.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.05 }}
							className="card card-hover p-5 group"
						>
							<div className="flex items-start justify-between mb-4">
								<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
									<BookOpen className="w-6 h-6 text-purple-400" />
								</div>

								<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<button
										onClick={() => {
											setEditingSubject(subject);
											setIsModalOpen(true);
										}}
										className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
									>
										<Edit2 className="w-4 h-4" />
									</button>
									<button
										onClick={() => handleDelete(subject.id)}
										className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</div>

							<h3 className="font-semibold text-white text-lg mb-1">
								{subject.name}
							</h3>
							<p className="text-purple-400 text-sm font-medium mb-3">
								{subject.code}
							</p>

							<div className="flex items-center gap-4 pt-4 border-t border-white/5">
								<div className="flex items-center gap-2 text-sm text-gray-400">
									<span className="badge-purple">
										{subject.credits} Credits
									</span>
								</div>
								<div className="flex items-center gap-2 text-sm text-gray-500">
									<FileText className="w-3.5 h-3.5" />
									{subject._count.syllabi} syllabi
								</div>
								<div className="flex items-center gap-2 text-sm text-gray-500">
									<GraduationCap className="w-3.5 h-3.5" />
									{subject._count.offerings} offerings
								</div>
							</div>
						</motion.div>
					))}
				</motion.div>
			)}

			{/* Modal */}
			<AnimatePresence>
				{isModalOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
						onClick={() => setIsModalOpen(false)}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							onClick={(e) => e.stopPropagation()}
							className="bg-[#0f0f23] border border-white/10 rounded-2xl p-6 w-full max-w-md"
						>
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-xl font-semibold text-white">
									{editingSubject ? "Edit Subject" : "Add New Subject"}
								</h2>
								<button
									onClick={() => setIsModalOpen(false)}
									className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
								>
									<X className="w-5 h-5" />
								</button>
							</div>

							{error && (
								<div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
									{error}
								</div>
							)}

							<form onSubmit={handleSubmit} className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Subject Code *
									</label>
									<input
										type="text"
										name="code"
										defaultValue={editingSubject?.code || ""}
										placeholder="e.g., CSE301"
										required
										className="input w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Subject Name *
									</label>
									<input
										type="text"
										name="name"
										defaultValue={editingSubject?.name || ""}
										placeholder="e.g., Data Structures"
										required
										className="input w-full"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Credits *
									</label>
									<input
										type="number"
										name="credits"
										defaultValue={editingSubject?.credits || 4}
										min={1}
										max={10}
										required
										className="input w-full"
									/>
								</div>

								<div className="flex items-center gap-3 pt-4">
									<button
										type="button"
										onClick={() => setIsModalOpen(false)}
										className="btn-secondary flex-1"
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={isPending}
										className="btn-primary flex-1 flex items-center justify-center gap-2"
									>
										{isPending ? (
											<>
												<Loader2 className="w-4 h-4 animate-spin" />
												Saving...
											</>
										) : editingSubject ? (
											"Update Subject"
										) : (
											"Add Subject"
										)}
									</button>
								</div>
							</form>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
