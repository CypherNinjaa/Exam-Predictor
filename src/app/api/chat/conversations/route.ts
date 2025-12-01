import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET /api/chat/conversations - Get all conversations for the user
export async function GET() {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Ensure user exists in database
		await ensureUserExists(userId);

		const conversations = await prisma.chatConversation.findMany({
			where: { userId },
			orderBy: { updatedAt: "desc" },
			select: {
				id: true,
				title: true,
				updatedAt: true,
			},
		});

		return NextResponse.json(conversations);
	} catch (error) {
		console.error("Failed to fetch conversations:", error);
		return NextResponse.json(
			{ error: "Failed to fetch conversations" },
			{ status: 500 }
		);
	}
}

// POST /api/chat/conversations - Create a new conversation
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Ensure user exists in database
		await ensureUserExists(userId);

		const body = await request.json();
		const { title } = body;

		if (!title) {
			return NextResponse.json({ error: "Title is required" }, { status: 400 });
		}

		const conversation = await prisma.chatConversation.create({
			data: {
				userId,
				title,
			},
		});

		// Log activity
		await prisma.activityLog.create({
			data: {
				userId,
				activityType: "CHAT_CREATED",
				description: `Created new chat conversation: ${title}`,
			},
		});

		return NextResponse.json(conversation, { status: 201 });
	} catch (error) {
		console.error("Failed to create conversation:", error);
		return NextResponse.json(
			{ error: "Failed to create conversation" },
			{ status: 500 }
		);
	}
}

// Helper function to ensure user exists in database
async function ensureUserExists(userId: string) {
	const existingUser = await prisma.user.findUnique({
		where: { id: userId },
	});

	if (!existingUser) {
		// Sync user from Clerk
		const user = await currentUser();
		if (!user) {
			throw new Error("User not found in Clerk");
		}

		// Determine role from Clerk metadata
		const clerkRole = (user.publicMetadata as { role?: string })?.role;
		let dbRole: "USER" | "ADMIN" | "SUPER_ADMIN" = "USER";

		if (clerkRole === "admin" || clerkRole === "ADMIN") {
			dbRole = "ADMIN";
		} else if (clerkRole === "super_admin" || clerkRole === "SUPER_ADMIN") {
			dbRole = "SUPER_ADMIN";
		}

		// Create user in database
		await prisma.user.create({
			data: {
				id: userId,
				email: user.emailAddresses[0]?.emailAddress || "",
				name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
				role: dbRole,
			},
		});
	}
}
