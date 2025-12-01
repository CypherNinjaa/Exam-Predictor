import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/analytics - Get analytics data
export async function GET(req: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get Clerk user for metadata
		const clerkUser = await currentUser();
		if (!clerkUser) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Check admin access from Clerk metadata
		const clerkRole = (clerkUser.publicMetadata as { role?: string })?.role;
		const isAdmin = clerkRole === "admin" || clerkRole === "ADMIN";

		if (!isAdmin) {
			return NextResponse.json(
				{ error: "Forbidden - Admin access required" },
				{ status: 403 }
			);
		}

		const searchParams = req.nextUrl.searchParams;
		const timeRange = searchParams.get("range") || "30"; // days

		// Calculate date range
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - parseInt(timeRange));

		// ========== OVERVIEW STATS ==========
		const [
			totalUsers,
			totalQuestions,
			totalNotes,
			totalPredictions,
			totalSubjects,
			activeUsers,
		] = await Promise.all([
			prisma.user.count(),
			prisma.question.count(),
			prisma.note.count({ where: { isPublic: true } }),
			prisma.predictionLog.count(),
			prisma.subject.count(),
			prisma.user.count({
				where: {
					lastActiveAt: {
						gte: startDate,
					},
				},
			}),
		]);

		// ========== USER GROWTH OVER TIME ==========
		const userGrowth = await prisma.$queryRaw<
			{ date: string; count: bigint }[]
		>`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*)::bigint as count
      FROM "User"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

		const userGrowthData = userGrowth.map((item) => ({
			date: item.date,
			count: Number(item.count),
		}));

		// ========== PREDICTIONS BY EXAM TYPE ==========
		const predictionsByExamType = await prisma.predictionLog.groupBy({
			by: ["examType"],
			_count: {
				id: true,
			},
			where: {
				createdAt: {
					gte: startDate,
				},
			},
		});

		const examTypeData = predictionsByExamType.map((item) => ({
			examType: item.examType,
			count: item._count.id,
		}));

		// ========== MOST PREDICTED SUBJECTS ==========
		const topSubjects = await prisma.predictionLog.groupBy({
			by: ["subjectId"],
			_count: {
				id: true,
			},
			where: {
				createdAt: {
					gte: startDate,
				},
			},
			orderBy: {
				_count: {
					id: "desc",
				},
			},
			take: 10,
		});

		// Fetch subject details
		const subjectIds = topSubjects.map((s) => s.subjectId);
		const subjects = await prisma.subject.findMany({
			where: {
				id: {
					in: subjectIds,
				},
			},
			select: {
				id: true,
				code: true,
				name: true,
			},
		});

		const subjectMap = new Map(subjects.map((s) => [s.id, s]));

		const topSubjectsData = topSubjects.map((item) => {
			const subject = subjectMap.get(item.subjectId);
			return {
				subjectId: item.subjectId,
				subjectCode: subject?.code || "Unknown",
				subjectName: subject?.name || "Unknown",
				predictionsCount: item._count.id,
			};
		});

		// ========== NOTES DOWNLOADS BY SUBJECT ==========
		const noteDownloads = await prisma.note.findMany({
			where: {
				isPublic: true,
				downloadCount: {
					gt: 0,
				},
			},
			select: {
				id: true,
				title: true,
				downloadCount: true,
				subjectId: true,
				subject: {
					select: {
						code: true,
						name: true,
					},
				},
			},
			orderBy: {
				downloadCount: "desc",
			},
			take: 10,
		});

		const notesDownloadsData = noteDownloads.map((note) => ({
			noteId: note.id,
			noteTitle: note.title,
			subjectCode: note.subject.code,
			subjectName: note.subject.name,
			downloads: note.downloadCount,
		}));

		// ========== DAILY ACTIVITY TRENDS ==========
		const activityTrends = await prisma.$queryRaw<
			{ date: string; activityType: string; count: bigint }[]
		>`
      SELECT 
        DATE("createdAt") as date,
        "activityType",
        COUNT(*)::bigint as count
      FROM "ActivityLog"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt"), "activityType"
      ORDER BY date ASC
    `;

		const activityTrendsData = activityTrends.map((item) => ({
			date: item.date,
			activityType: item.activityType,
			count: Number(item.count),
		}));

		// ========== PYQ COVERAGE ANALYSIS ==========
		// Calculate how many subjects have questions uploaded
		const subjectsWithQuestions = await prisma.subject.findMany({
			select: {
				id: true,
				code: true,
				name: true,
				_count: {
					select: {
						exams: true,
					},
				},
			},
		});

		const pyqCoverageData = subjectsWithQuestions
			.filter((s) => s._count.exams > 0)
			.map((s) => ({
				subjectCode: s.code,
				subjectName: s.name,
				examsCount: s._count.exams,
			}))
			.sort((a, b) => b.examsCount - a.examsCount)
			.slice(0, 10);

		const coveragePercentage =
			totalSubjects > 0 ? (pyqCoverageData.length / totalSubjects) * 100 : 0;

		// ========== MODEL USAGE STATS ==========
		const modelUsage = await prisma.predictionLog.groupBy({
			by: ["modelUsed"],
			_count: {
				id: true,
			},
			_avg: {
				confidenceScore: true,
				processingTime: true,
			},
			where: {
				createdAt: {
					gte: startDate,
				},
			},
		});

		const modelUsageData = modelUsage.map((item) => ({
			model: item.modelUsed,
			usageCount: item._count.id,
			avgConfidence: item._avg.confidenceScore || 0,
			avgProcessingTime: item._avg.processingTime || 0,
		}));

		// ========== RECENT ACTIVITIES ==========
		const recentActivities = await prisma.activityLog.findMany({
			take: 20,
			orderBy: {
				createdAt: "desc",
			},
			include: {
				user: {
					select: {
						email: true,
						name: true,
					},
				},
			},
		});

		return NextResponse.json({
			overview: {
				totalUsers,
				totalQuestions,
				totalNotes,
				totalPredictions,
				totalSubjects,
				activeUsers,
				timeRange: parseInt(timeRange),
			},
			userGrowth: userGrowthData,
			examTypes: examTypeData,
			topSubjects: topSubjectsData,
			notesDownloads: notesDownloadsData,
			activityTrends: activityTrendsData,
			pyqCoverage: {
				data: pyqCoverageData,
				coveragePercentage: Math.round(coveragePercentage * 100) / 100,
				totalSubjects,
				subjectsWithPYQ: pyqCoverageData.length,
			},
			modelUsage: modelUsageData,
			recentActivities: recentActivities.map((a) => ({
				id: a.id,
				type: a.activityType,
				description: a.description,
				userEmail: a.user.email,
				userName: a.user.name,
				createdAt: a.createdAt,
			})),
		});
	} catch (error) {
		console.error("Error fetching analytics:", error);
		return NextResponse.json(
			{ error: "Failed to fetch analytics" },
			{ status: 500 }
		);
	}
}
