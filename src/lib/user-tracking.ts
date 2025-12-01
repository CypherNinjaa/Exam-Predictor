import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Middleware to sync authenticated user with database
 * Creates or updates user record from Clerk data
 */
export async function syncUser() {
	try {
		const { userId } = await auth();
		if (!userId) return null;

		// Check if user exists in database
		const existingUser = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (existingUser) {
			// Update last active time
			await prisma.user.update({
				where: { id: userId },
				data: { lastActiveAt: new Date() },
			});
			return existingUser;
		}

		// If user doesn't exist, we'll need Clerk data
		// This will be called from the client-side to fetch full user data
		return null;
	} catch (error) {
		console.error("Error syncing user:", error);
		return null;
	}
}

/**
 * Track user activity
 */
export async function trackActivity(
	userId: string,
	activityType: string,
	description?: string,
	metadata?: any
) {
	try {
		await prisma.activityLog.create({
			data: {
				userId,
				activityType: activityType as any,
				description,
				metadata,
			},
		});
	} catch (error) {
		console.error("Error tracking activity:", error);
	}
}

/**
 * Track prediction generation
 */
export async function trackPrediction(
	userId: string | null,
	subjectId: string,
	examType: string,
	modelUsed: string,
	confidenceScore: number,
	questionsCount: number,
	processingTime: number
) {
	try {
		await prisma.predictionLog.create({
			data: {
				userId,
				subjectId,
				examType: examType as any,
				modelUsed,
				confidenceScore,
				questionsCount,
				processingTime,
			},
		});
	} catch (error) {
		console.error("Error tracking prediction:", error);
	}
}

/**
 * Track note download
 */
export async function trackDownload(userId: string | null, noteId: string) {
	try {
		// Create download log
		await prisma.downloadLog.create({
			data: {
				userId,
				noteId,
			},
		});

		// Increment download count on note
		await prisma.note.update({
			where: { id: noteId },
			data: {
				downloadCount: {
					increment: 1,
				},
			},
		});
	} catch (error) {
		console.error("Error tracking download:", error);
	}
}
