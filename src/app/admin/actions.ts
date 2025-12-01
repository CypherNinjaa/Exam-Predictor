"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============ COLLEGE ACTIONS ============

export async function getCollege() {
	try {
		const college = await prisma.college.findFirst();
		return { success: true, data: college };
	} catch (error) {
		console.error("Error fetching college:", error);
		return { success: false, error: "Failed to fetch college" };
	}
}

export async function updateCollege(formData: FormData) {
	try {
		const name = formData.get("name") as string;
		const code = formData.get("code") as string;
		const location = formData.get("location") as string;

		let college = await prisma.college.findFirst();

		if (college) {
			college = await prisma.college.update({
				where: { id: college.id },
				data: { name, code, location },
			});
		} else {
			college = await prisma.college.create({
				data: { name, code, location },
			});
		}

		revalidatePath("/admin/settings");
		return { success: true, data: college };
	} catch (error) {
		console.error("Error updating college:", error);
		return { success: false, error: "Failed to update college" };
	}
}

// ============ COURSE ACTIONS ============

export async function getCourses() {
	try {
		const college = await prisma.college.findFirst();
		if (!college) {
			return { success: true, data: [] };
		}

		const courses = await prisma.course.findMany({
			where: { collegeId: college.id },
			include: {
				_count: {
					select: { batches: true },
				},
			},
			orderBy: { name: "asc" },
		});
		return { success: true, data: courses };
	} catch (error) {
		console.error("Error fetching courses:", error);
		return { success: false, error: "Failed to fetch courses", data: [] };
	}
}

export async function createCourse(formData: FormData) {
	try {
		const name = formData.get("name") as string;
		const code = formData.get("code") as string;
		const duration = parseInt(formData.get("duration") as string);
		const description = formData.get("description") as string;

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

		const course = await prisma.course.create({
			data: {
				name,
				code,
				duration,
				description,
				collegeId: college.id,
			},
		});

		revalidatePath("/admin/settings");
		return { success: true, data: course };
	} catch (error) {
		console.error("Error creating course:", error);
		return { success: false, error: "Failed to create course" };
	}
}

export async function deleteCourse(id: string) {
	try {
		await prisma.course.delete({ where: { id } });
		revalidatePath("/admin/settings");
		return { success: true };
	} catch (error) {
		console.error("Error deleting course:", error);
		return { success: false, error: "Failed to delete course" };
	}
}

// ============ BATCH ACTIONS ============

export async function getBatches(courseId?: string) {
	try {
		const batches = await prisma.batch.findMany({
			where: courseId ? { courseId } : undefined,
			include: {
				course: true,
				_count: {
					select: { semesters: true },
				},
			},
			orderBy: { startYear: "desc" },
		});
		return { success: true, data: batches };
	} catch (error) {
		console.error("Error fetching batches:", error);
		return { success: false, error: "Failed to fetch batches", data: [] };
	}
}

export async function createBatch(courseId: string, startYear: number) {
	try {
		const course = await prisma.course.findUnique({ where: { id: courseId } });
		if (!course) {
			return { success: false, error: "Course not found" };
		}

		const endYear = startYear + course.duration;
		const totalSemesters = course.duration * 2;

		// Create batch
		const batch = await prisma.batch.create({
			data: {
				startYear,
				endYear,
				courseId,
				isActive: true,
			},
		});

		// Auto-create all semesters
		for (let sem = 1; sem <= totalSemesters; sem++) {
			await prisma.semester.create({
				data: {
					number: sem,
					batchId: batch.id,
				},
			});
		}

		revalidatePath("/admin/settings");
		return { success: true, data: batch };
	} catch (error) {
		console.error("Error creating batch:", error);
		return { success: false, error: "Failed to create batch" };
	}
}

export async function deleteBatch(id: string) {
	try {
		await prisma.batch.delete({ where: { id } });
		revalidatePath("/admin/settings");
		return { success: true };
	} catch (error) {
		console.error("Error deleting batch:", error);
		return { success: false, error: "Failed to delete batch" };
	}
}

// ============ SEMESTER ACTIONS ============

export async function getSemesters(batchId: string) {
	try {
		const semesters = await prisma.semester.findMany({
			where: { batchId },
			include: {
				_count: {
					select: { subjects: true, exams: true },
				},
			},
			orderBy: { number: "asc" },
		});
		return { success: true, data: semesters };
	} catch (error) {
		console.error("Error fetching semesters:", error);
		return { success: false, error: "Failed to fetch semesters", data: [] };
	}
}

// ============ SUBJECT ACTIONS ============

const SubjectSchema = z.object({
	code: z.string().min(1, "Subject code is required"),
	name: z.string().min(1, "Subject name is required"),
	credits: z.coerce.number().min(1).max(10),
	semesterId: z.string().min(1, "Semester is required"),
});

export async function getSubjects(semesterId?: string) {
	try {
		const subjects = await prisma.subject.findMany({
			where: semesterId ? { semesterId } : undefined,
			include: {
				semester: {
					include: {
						batch: {
							include: {
								course: true,
							},
						},
					},
				},
				syllabus: true,
				_count: {
					select: { exams: true },
				},
			},
			orderBy: { code: "asc" },
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
			semesterId: formData.get("semesterId"),
		});

		const subject = await prisma.subject.create({
			data: {
				code: data.code,
				name: data.name,
				credits: data.credits,
				semesterId: data.semesterId,
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
		const code = formData.get("code") as string;
		const name = formData.get("name") as string;
		const credits = parseInt(formData.get("credits") as string);

		const subject = await prisma.subject.update({
			where: { id },
			data: { code, name, credits },
		});

		revalidatePath("/admin/subjects");
		return { success: true, data: subject };
	} catch (error) {
		console.error("Error updating subject:", error);
		return { success: false, error: "Failed to update subject" };
	}
}

export async function deleteSubject(id: string) {
	try {
		await prisma.subject.delete({ where: { id } });
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
				subject: {
					include: {
						semester: {
							include: {
								batch: {
									include: {
										course: true,
									},
								},
							},
						},
					},
				},
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
				subject: {
					include: {
						semester: {
							include: {
								batch: {
									include: {
										course: true,
									},
								},
							},
						},
					},
				},
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
		await prisma.syllabus.delete({ where: { id } });
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
						subject: true,
						semester: {
							include: {
								batch: {
									include: {
										course: true,
									},
								},
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
	text: z.string().min(1, "Question text is required"),
	marks: z.coerce.number().min(1),
	examId: z.string().min(1, "Exam is required"),
});

export async function createQuestion(formData: FormData) {
	try {
		const data = QuestionSchema.parse({
			text: formData.get("text"),
			marks: formData.get("marks"),
			examId: formData.get("examId"),
		});

		// Generate question number
		const existingCount = await prisma.question.count({
			where: { examId: data.examId },
		});

		const question = await prisma.question.create({
			data: {
				questionNumber: `Q${existingCount + 1}`,
				text: data.text,
				marks: data.marks,
				difficulty: "MEDIUM",
				bloomsLevel: "UNDERSTAND",
				examId: data.examId,
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
		await prisma.question.delete({ where: { id } });
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
				subject: true,
				semester: {
					include: {
						batch: {
							include: {
								course: true,
							},
						},
					},
				},
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

export async function getExamsForSubject(subjectId: string) {
	try {
		const exams = await prisma.exam.findMany({
			where: { subjectId },
			orderBy: { examDate: "desc" },
		});
		return { success: true, data: exams };
	} catch (error) {
		console.error("Error fetching exams for subject:", error);
		return { success: false, error: "Failed to fetch exams", data: [] };
	}
}

const ExamSchema = z.object({
	examType: z.enum(["MIDTERM_1", "MIDTERM_2", "END_TERM"]),
	date: z.string().optional(),
	totalMarks: z.coerce.number().min(1),
	subjectId: z.string().min(1, "Subject is required"),
	semesterId: z.string().min(1, "Semester is required"),
});

export async function createExam(formData: FormData) {
	try {
		const data = ExamSchema.parse({
			examType: formData.get("examType"),
			date: formData.get("date"),
			totalMarks: formData.get("totalMarks"),
			subjectId: formData.get("subjectId"),
			semesterId: formData.get("semesterId"),
		});

		const exam = await prisma.exam.create({
			data: {
				examType: data.examType,
				examDate: data.date ? new Date(data.date) : null,
				totalMarks: data.totalMarks,
				subjectId: data.subjectId,
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
		await prisma.exam.delete({ where: { id } });
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
			coursesCount,
			batchesCount,
			subjectsCount,
			syllabiCount,
			questionsCount,
			examsCount,
		] = await Promise.all([
			prisma.course.count(),
			prisma.batch.count(),
			prisma.subject.count(),
			prisma.syllabus.count(),
			prisma.question.count(),
			prisma.exam.count(),
		]);

		return {
			success: true,
			data: {
				courses: coursesCount,
				batches: batchesCount,
				subjects: subjectsCount,
				syllabi: syllabiCount,
				questions: questionsCount,
				exams: examsCount,
			},
		};
	} catch (error) {
		console.error("Error fetching admin stats:", error);
		return {
			success: false,
			error: "Failed to fetch stats",
			data: {
				courses: 0,
				batches: 0,
				subjects: 0,
				syllabi: 0,
				questions: 0,
				exams: 0,
			},
		};
	}
}

// ============ DROPDOWN DATA ============

export async function getDropdownData() {
	try {
		const [courses, batches, semesters, subjects, exams] = await Promise.all([
			prisma.course.findMany({ orderBy: { name: "asc" } }),
			prisma.batch.findMany({
				include: { course: true },
				orderBy: { startYear: "desc" },
			}),
			prisma.semester.findMany({
				include: {
					batch: {
						include: { course: true },
					},
				},
				orderBy: { number: "asc" },
			}),
			prisma.subject.findMany({
				include: {
					semester: {
						include: {
							batch: {
								include: { course: true },
							},
						},
					},
				},
				orderBy: { code: "asc" },
			}),
			prisma.exam.findMany({
				include: { subject: true },
				orderBy: { createdAt: "desc" },
			}),
		]);

		return {
			success: true,
			data: { courses, batches, semesters, subjects, exams },
		};
	} catch (error) {
		console.error("Error fetching dropdown data:", error);
		return { success: false, error: "Failed to fetch dropdown data" };
	}
}
