import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/user/sync - Sync current user with database
export async function GET() {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get full user data from Clerk
		const user = await currentUser();
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Determine role from Clerk metadata
		const clerkRole = (user.publicMetadata as { role?: string })?.role;
		let dbRole: "USER" | "ADMIN" | "SUPER_ADMIN" = "USER";

		if (clerkRole === "admin" || clerkRole === "ADMIN") {
			dbRole = "ADMIN";
		} else if (clerkRole === "super_admin" || clerkRole === "SUPER_ADMIN") {
			dbRole = "SUPER_ADMIN";
		}

		// Upsert user in database
		const syncedUser = await prisma.user.upsert({
			where: { id: userId },
			update: {
				email: user.emailAddresses[0]?.emailAddress || "",
				name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
				role: dbRole,
				lastActiveAt: new Date(),
			},
			create: {
				id: userId,
				email: user.emailAddresses[0]?.emailAddress || "",
				name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
				role: dbRole,
			},
		});

		return NextResponse.json({ user: syncedUser });
	} catch (error) {
		console.error("Error syncing user:", error);
		return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
	}
}
