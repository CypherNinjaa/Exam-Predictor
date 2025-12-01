import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/search - Global search across subjects, notes, questions
export async function GET(req: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const searchParams = req.nextUrl.searchParams;
		const query = searchParams.get("q");
		const type = searchParams.get("type"); // "all", "subjects", "notes", "questions"

		if (!query || query.trim().length < 2) {
			return NextResponse.json(
				{ error: "Search query must be at least 2 characters" },
				{ status: 400 }
			);
		}

		const searchQuery = query.trim();
		const results: any = {
			subjects: [],
			notes: [],
			questions: [],
			syllabi: [],
		};

		// ========== SEARCH SUBJECTS ==========
		if (!type || type === "all" || type === "subjects") {
			const subjects = await prisma.subject.findMany({
				where: {
					OR: [
						{
							name: {
								contains: searchQuery,
								mode: "insensitive",
							},
						},
						{
							code: {
								contains: searchQuery,
								mode: "insensitive",
							},
						},
					],
				},
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
					_count: {
						select: {
							notes: true,
							exams: true,
						},
					},
				},
				take: 10,
			});

			results.subjects = subjects.map((s) => ({
				id: s.id,
				type: "subject",
				title: s.name,
				subtitle: s.code,
				description: `${s.semester.batch.course.name} - Sem ${s.semester.number}`,
				notesCount: s._count.notes,
				examsCount: s._count.exams,
				url: `/dashboard?subject=${s.id}`,
			}));
		}

		// ========== SEARCH NOTES ==========
		if (!type || type === "all" || type === "notes") {
			const notes = await prisma.note.findMany({
				where: {
					AND: [
						{ isPublic: true },
						{
							OR: [
								{
									title: {
										contains: searchQuery,
										mode: "insensitive",
									},
								},
								{
									description: {
										contains: searchQuery,
										mode: "insensitive",
									},
								},
								{
									keyTopics: {
										hasSome: [searchQuery],
									},
								},
							],
						},
					],
				},
				include: {
					subject: {
						select: {
							code: true,
							name: true,
						},
					},
				},
				take: 10,
			});

			results.notes = notes.map((n) => ({
				id: n.id,
				type: "note",
				title: n.title,
				subtitle: `${n.subject.code} - ${n.subject.name}`,
				description: n.description || `${n.keyTopics.slice(0, 3).join(", ")}`,
				fileType: n.fileType,
				downloadCount: n.downloadCount,
				url: `/notes?id=${n.id}`,
			}));
		}

		// ========== SEARCH QUESTIONS ==========
		if (!type || type === "all" || type === "questions") {
			const questions = await prisma.question.findMany({
				where: {
					OR: [
						{
							text: {
								contains: searchQuery,
								mode: "insensitive",
							},
						},
						{
							keywords: {
								hasSome: [searchQuery],
							},
						},
					],
				},
				include: {
					exam: {
						include: {
							subject: {
								select: {
									code: true,
									name: true,
								},
							},
						},
					},
					topic: {
						select: {
							name: true,
						},
					},
				},
				take: 10,
			});

			results.questions = questions.map((q) => ({
				id: q.id,
				type: "question",
				title: q.text.substring(0, 100) + (q.text.length > 100 ? "..." : ""),
				subtitle: `${q.exam.subject.code} - ${q.exam.examType}`,
				description: q.topic ? `Topic: ${q.topic.name}` : "",
				marks: q.marks,
				difficulty: q.difficulty,
				url: `/questions?id=${q.id}`,
			}));
		}

		// ========== SEARCH SYLLABI ==========
		if (!type || type === "all" || type === "syllabi") {
			const syllabi = await prisma.syllabus.findMany({
				where: {
					OR: [
						{
							description: {
								contains: searchQuery,
								mode: "insensitive",
							},
						},
						{
							subject: {
								OR: [
									{
										name: {
											contains: searchQuery,
											mode: "insensitive",
										},
									},
									{
										code: {
											contains: searchQuery,
											mode: "insensitive",
										},
									},
								],
							},
						},
					],
				},
				include: {
					subject: {
						select: {
							code: true,
							name: true,
						},
					},
					_count: {
						select: {
							modules: true,
						},
					},
				},
				take: 10,
			});

			results.syllabi = syllabi.map((s) => ({
				id: s.id,
				type: "syllabus",
				title: `${s.subject.code} Syllabus`,
				subtitle: s.subject.name,
				description: s.description || `Version ${s.version}`,
				modulesCount: s._count.modules,
				url: `/syllabus?id=${s.id}`,
			}));
		}

		// Calculate total results
		const totalResults =
			results.subjects.length +
			results.notes.length +
			results.questions.length +
			results.syllabi.length;

		return NextResponse.json({
			query: searchQuery,
			totalResults,
			results,
		});
	} catch (error) {
		console.error("Error performing search:", error);
		return NextResponse.json(
			{ error: "Failed to perform search" },
			{ status: 500 }
		);
	}
}
