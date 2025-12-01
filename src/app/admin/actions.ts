"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============ SUBJECT ACTIONS ============

const SubjectSchema = z.object({
	code: z.string().min(1, "Subject code is required"),
	name: z.string().min(1, "Subject name is required"),
	credits: z.coerce.number().min(1).max(10),
});

export async function getSubjects() {
	try {
		const college = await prisma.college.findFirst();
		if (!college) {
			return { success: true, data: [] };
		}

		const subjects = await prisma.subject.findMany({
			where: { collegeId: college.id },
			include: {
				_count: {
					select: {
						syllabi: true,
						offerings: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});
		return { success: true, data: subjects };
	} catch (error) {
		console.error("Error fetching subjects:", error);
		return { success: false, error: "Failed to fetch subjects", data: [] };
	}
}

export async function createSubject(formData: FormData) {
	try {
		const data = SubjectSchema.parse({
			code: formData.get("code"),
			name: formData.get("name"),
			credits: formData.get("credits"),
		});

		// Get or create default college
		let college = await prisma.college.findFirst();
		if (!college) {
			college = await prisma.college.create({
				data: {
					name: "Amity University Patna",
					code: "AUP",
					location: "Patna, Bihar",
				},
			});
		}

		const subject = await prisma.subject.create({
			data: {
				code: data.code,
				name: data.name,
				credits: data.credits,
				collegeId: college.id,
			},
		});

		revalidatePath("/admin/subjects");
		return { success: true, data: subject };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { success: false, error: error.errors[0].message };
		}
		console.error("Error creating subject:", error);
		return { success: false, error: "Failed to create subject" };
	}
}

export async function updateSubject(id: string, formData: FormData) {
	try {
		const data = SubjectSchema.parse({
			code: formData.get("code"),
			name: formData.get("name"),
			credits: formData.get("credits"),
		});

		const subject = await prisma.subject.update({
			where: { id },
			data: {
				code: data.code,
				name: data.name,
				credits: data.credits,
			},
		});

		revalidatePath("/admin/subjects");
		return { success: true, data: subject };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { success: false, error: error.errors[0].message };
		}
		console.error("Error updating subject:", error);
		return { success: false, error: "Failed to update subject" };
	}
}

export async function deleteSubject(id: string) {
	try {
		await prisma.subject.delete({
			where: { id },
		});

		revalidatePath("/admin/subjects");
		return { success: true };
	} catch (error) {
		console.error("Error deleting subject:", error);
		return { success: false, error: "Failed to delete subject" };
	}
}

// ============ SYLLABUS ACTIONS ============

export async function getSyllabi() {
	try {
		const syllabi = await prisma.syllabus.findMany({
			include: {
				subject: true,
				modules: {
					include: {
						topics: true,
					},
				},
				_count: {
					select: { modules: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});
		return { success: true, data: syllabi };
	} catch (error) {
		console.error("Error fetching syllabi:", error);
		return { success: false, error: "Failed to fetch syllabi", data: [] };
	}
}

export async function getSyllabusById(id: string) {
	try {
		const syllabus = await prisma.syllabus.findUnique({
			where: { id },
			include: {
				subject: true,
				modules: {
					include: {
						topics: {
							include: {
								subTopics: true,
							},
						},
					},
					orderBy: { number: "asc" },
				},
				books: true,
				evaluation: true,
			},
		});
		return { success: true, data: syllabus };
	} catch (error) {
		console.error("Error fetching syllabus:", error);
		return { success: false, error: "Failed to fetch syllabus" };
	}
}

export async function deleteSyllabus(id: string) {
	try {
		await prisma.syllabus.delete({
			where: { id },
		});

		revalidatePath("/admin/syllabi");
		return { success: true };
	} catch (error) {
		console.error("Error deleting syllabus:", error);
		return { success: false, error: "Failed to delete syllabus" };
	}
}

// ============ QUESTION ACTIONS ============

export async function getQuestions() {
	try {
		const questions = await prisma.question.findMany({
			include: {
				exam: {
					include: {
						subjectOffering: {
							include: {
								subject: true,
							},
						},
					},
				},
				topic: true,
				module: true,
			},
			orderBy: { createdAt: "desc" },
		});
		return { success: true, data: questions };
	} catch (error) {
		console.error("Error fetching questions:", error);
		return { success: false, error: "Failed to fetch questions", data: [] };
	}
}

const QuestionSchema = z.object({
	questionNumber: z.string().min(1, "Question number is required"),
	text: z.string().min(1, "Question text is required"),
	marks: z.coerce.number().min(1),
	difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
	bloomsLevel: z.enum([
		"REMEMBER",
		"UNDERSTAND",
		"APPLY",
		"ANALYZE",
		"EVALUATE",
		"CREATE",
	]),
	examId: z.string().min(1, "Exam is required"),
	topicId: z.string().optional(),
	moduleId: z.string().optional(),
});

export async function createQuestion(formData: FormData) {
	try {
		const data = QuestionSchema.parse({
			questionNumber: formData.get("questionNumber"),
			text: formData.get("text"),
			marks: formData.get("marks"),
			difficulty: formData.get("difficulty"),
			bloomsLevel: formData.get("bloomsLevel"),
			examId: formData.get("examId"),
			topicId: formData.get("topicId"),
			moduleId: formData.get("moduleId"),
		});

		const question = await prisma.question.create({
			data: {
				questionNumber: data.questionNumber,
				text: data.text,
				marks: data.marks,
				difficulty: data.difficulty,
				bloomsLevel: data.bloomsLevel,
				examId: data.examId,
				topicId: data.topicId || null,
				moduleId: data.moduleId || null,
			},
		});

		revalidatePath("/admin/questions");
		return { success: true, data: question };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { success: false, error: error.errors[0].message };
		}
		console.error("Error creating question:", error);
		return { success: false, error: "Failed to create question" };
	}
}

export async function deleteQuestion(id: string) {
	try {
		await prisma.question.delete({
			where: { id },
		});

		revalidatePath("/admin/questions");
		return { success: true };
	} catch (error) {
		console.error("Error deleting question:", error);
		return { success: false, error: "Failed to delete question" };
	}
}

// ============ EXAM ACTIONS ============

export async function getExams() {
	try {
		const exams = await prisma.exam.findMany({
			include: {
				subjectOffering: {
					include: {
						subject: true,
					},
				},
				semester: true,
				_count: {
					select: { questions: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});
		return { success: true, data: exams };
	} catch (error) {
		console.error("Error fetching exams:", error);
		return { success: false, error: "Failed to fetch exams", data: [] };
	}
}

const ExamSchema = z.object({
	type: z.enum(["MIDTERM_1", "MIDTERM_2", "END_TERM"]),
	date: z.string().min(1, "Date is required"),
	totalMarks: z.coerce.number().min(1),
	subjectOfferingId: z.string().min(1, "Subject offering is required"),
	semesterId: z.string().min(1, "Semester is required"),
});

export async function createExam(formData: FormData) {
	try {
		const data = ExamSchema.parse({
			type: formData.get("type"),
			date: formData.get("date"),
			totalMarks: formData.get("totalMarks"),
			subjectOfferingId: formData.get("subjectOfferingId"),
			semesterId: formData.get("semesterId"),
		});

		const exam = await prisma.exam.create({
			data: {
				examType: data.type,
				examDate: new Date(data.date),
				totalMarks: data.totalMarks,
				subjectOfferingId: data.subjectOfferingId,
				semesterId: data.semesterId,
			},
		});

		revalidatePath("/admin/exams");
		return { success: true, data: exam };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { success: false, error: error.errors[0].message };
		}
		console.error("Error creating exam:", error);
		return { success: false, error: "Failed to create exam" };
	}
}

export async function deleteExam(id: string) {
	try {
		await prisma.exam.delete({
			where: { id },
		});

		revalidatePath("/admin/exams");
		return { success: true };
	} catch (error) {
		console.error("Error deleting exam:", error);
		return { success: false, error: "Failed to delete exam" };
	}
}

// ============ STATS ACTIONS ============

export async function getAdminStats() {
	try {
		const [
			subjectsCount,
			syllabiCount,
			questionsCount,
			examsCount,
			modulesCount,
			topicsCount,
		] = await Promise.all([
			prisma.subject.count(),
			prisma.syllabus.count(),
			prisma.question.count(),
			prisma.exam.count(),
			prisma.module.count(),
			prisma.topic.count(),
		]);

		return {
			success: true,
			data: {
				subjects: subjectsCount,
				syllabi: syllabiCount,
				questions: questionsCount,
				exams: examsCount,
				modules: modulesCount,
				topics: topicsCount,
			},
		};
	} catch (error) {
		console.error("Error fetching admin stats:", error);
		return {
			success: false,
			error: "Failed to fetch stats",
			data: {
				subjects: 0,
				syllabi: 0,
				questions: 0,
				exams: 0,
				modules: 0,
				topics: 0,
			},
		};
	}
}

// ============ DROPDOWN DATA ============

export async function getDropdownData() {
	try {
		const [subjects, exams, topics, modules, subjectOfferings, semesters] =
			await Promise.all([
				prisma.subject.findMany({ orderBy: { name: "asc" } }),
				prisma.exam.findMany({
					include: {
						subjectOffering: {
							include: { subject: true },
						},
					},
					orderBy: { createdAt: "desc" },
				}),
				prisma.topic.findMany({
					include: { module: { include: { syllabus: true } } },
					orderBy: { name: "asc" },
				}),
				prisma.module.findMany({
					include: { syllabus: { include: { subject: true } } },
					orderBy: { name: "asc" },
				}),
				prisma.subjectOffering.findMany({
					include: { subject: true, semester: true },
					orderBy: { createdAt: "desc" },
				}),
				prisma.semester.findMany({
					include: { academicYear: true },
					orderBy: { number: "asc" },
				}),
			]);

		return {
			success: true,
			data: { subjects, exams, topics, modules, subjectOfferings, semesters },
		};
	} catch (error) {
		console.error("Error fetching dropdown data:", error);
		return { success: false, error: "Failed to fetch dropdown data" };
	}
}
