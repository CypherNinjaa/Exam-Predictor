"use client";

import { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";

type UploadType = "exam" | "syllabus" | "notes";

interface UploadResult {
	success: boolean;
	message: string;
	data?: any;
}

export default function UploadPage() {
	const [uploadType, setUploadType] = useState<UploadType>("exam");
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [result, setResult] = useState<UploadResult | null>(null);
	const [formData, setFormData] = useState({
		year: new Date().getFullYear(),
		semester: 1,
		subjectCode: "",
		examType: "END_TERM",
	});
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setFile(e.target.files[0]);
			setResult(null);
		}
	};

	const handleUpload = async () => {
		if (!file) return;

		setUploading(true);
		setResult(null);

		try {
			const form = new FormData();
			form.append("file", file);
			form.append("type", uploadType);
			form.append("year", formData.year.toString());
			form.append("semester", formData.semester.toString());
			form.append("subjectCode", formData.subjectCode);
			form.append("examType", formData.examType);

			const response = await fetch("/api/upload", {
				method: "POST",
				body: form,
			});

			const data = await response.json();
			setResult({
				success: response.ok,
				message:
					data.message ||
					(response.ok ? "Upload successful!" : "Upload failed"),
				data: data,
			});

			if (response.ok) {
				setFile(null);
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
			}
		} catch (error) {
			setResult({
				success: false,
				message: "An error occurred during upload",
			});
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="min-h-screen">
			<Navbar />

			<main className="container mx-auto px-4 py-8 max-w-2xl">
				<h1 className="text-3xl font-bold mb-8">📤 Upload Data</h1>

				{/* Upload Type Selector */}
				<div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-6">
					<h2 className="text-lg font-semibold mb-4">Select Upload Type</h2>
					<div className="grid grid-cols-3 gap-3">
						<TypeButton
							active={uploadType === "exam"}
							onClick={() => setUploadType("exam")}
							icon="📝"
							label="Exam Paper"
						/>
						<TypeButton
							active={uploadType === "syllabus"}
							onClick={() => setUploadType("syllabus")}
							icon="📘"
							label="Syllabus"
						/>
						<TypeButton
							active={uploadType === "notes"}
							onClick={() => setUploadType("notes")}
							icon="📒"
							label="Lecture Notes"
						/>
					</div>
				</div>

				{/* Metadata Form */}
				<div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-6">
					<h2 className="text-lg font-semibold mb-4">Document Details</h2>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm text-gray-400 mb-1">
								Academic Year
							</label>
							<select
								value={formData.year}
								onChange={(e) =>
									setFormData({ ...formData, year: parseInt(e.target.value) })
								}
								className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
							>
								{[2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
									<option key={y} value={y} className="bg-gray-800">
										{y}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm text-gray-400 mb-1">
								Semester
							</label>
							<select
								value={formData.semester}
								onChange={(e) =>
									setFormData({
										...formData,
										semester: parseInt(e.target.value),
									})
								}
								className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
							>
								{[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
									<option key={s} value={s} className="bg-gray-800">
										Semester {s}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm text-gray-400 mb-1">
								Subject Code
							</label>
							<input
								type="text"
								placeholder="e.g., CSE301"
								value={formData.subjectCode}
								onChange={(e) =>
									setFormData({
										...formData,
										subjectCode: e.target.value.toUpperCase(),
									})
								}
								className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500"
							/>
						</div>

						{uploadType === "exam" && (
							<div>
								<label className="block text-sm text-gray-400 mb-1">
									Exam Type
								</label>
								<select
									value={formData.examType}
									onChange={(e) =>
										setFormData({ ...formData, examType: e.target.value })
									}
									className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
								>
									<option value="MIDTERM_1" className="bg-gray-800">
										Midterm 1
									</option>
									<option value="MIDTERM_2" className="bg-gray-800">
										Midterm 2
									</option>
									<option value="END_TERM" className="bg-gray-800">
										End Term
									</option>
								</select>
							</div>
						)}
					</div>
				</div>

				{/* File Upload */}
				<div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-6">
					<h2 className="text-lg font-semibold mb-4">Upload File</h2>

					<div
						className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${
								file
									? "border-purple-500 bg-purple-500/10"
									: "border-white/20 hover:border-purple-500/50"
							}`}
						onClick={() => fileInputRef.current?.click()}
					>
						<input
							ref={fileInputRef}
							type="file"
							accept=".pdf"
							onChange={handleFileChange}
							className="hidden"
						/>

						{file ? (
							<div>
								<span className="text-4xl">📄</span>
								<p className="mt-2 font-medium">{file.name}</p>
								<p className="text-sm text-gray-400">
									{(file.size / 1024 / 1024).toFixed(2)} MB
								</p>
							</div>
						) : (
							<div>
								<span className="text-4xl">📁</span>
								<p className="mt-2 font-medium">Click to select PDF file</p>
								<p className="text-sm text-gray-400">or drag and drop</p>
							</div>
						)}
					</div>
				</div>

				{/* Result Message */}
				{result && (
					<div
						className={`rounded-xl p-4 mb-6 ${
							result.success
								? "bg-green-500/20 border border-green-500/50"
								: "bg-red-500/20 border border-red-500/50"
						}`}
					>
						<p className={result.success ? "text-green-400" : "text-red-400"}>
							{result.success ? "✅" : "❌"} {result.message}
						</p>
					</div>
				)}

				{/* Upload Button */}
				<button
					onClick={handleUpload}
					disabled={!file || !formData.subjectCode || uploading}
					className={`w-full py-3 rounded-xl font-semibold transition-all
            ${
							!file || !formData.subjectCode || uploading
								? "bg-gray-600 cursor-not-allowed"
								: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
						}`}
				>
					{uploading ? (
						<span className="flex items-center justify-center gap-2">
							<div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
							Processing...
						</span>
					) : (
						`Upload ${
							uploadType === "exam"
								? "Exam Paper"
								: uploadType === "syllabus"
								? "Syllabus"
								: "Lecture Notes"
						}`
					)}
				</button>
			</main>
		</div>
	);
}

function TypeButton({
	active,
	onClick,
	icon,
	label,
}: {
	active: boolean;
	onClick: () => void;
	icon: string;
	label: string;
}) {
	return (
		<button
			onClick={onClick}
			className={`p-4 rounded-lg text-center transition-all
        ${
					active
						? "bg-purple-600 border-2 border-purple-400"
						: "bg-white/5 border-2 border-transparent hover:border-white/20"
				}`}
		>
			<span className="text-2xl">{icon}</span>
			<p className="text-sm mt-1">{label}</p>
		</button>
	);
}
