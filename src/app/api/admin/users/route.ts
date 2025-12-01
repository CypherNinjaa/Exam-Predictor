import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users - List all users with activity stats
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

		// Auto-sync current user if not in database
		let currentDbUser = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!currentDbUser) {
			// Create user in database
			let dbRole: "USER" | "ADMIN" | "SUPER_ADMIN" = "USER";
			if (clerkRole === "admin" || clerkRole === "ADMIN") {
				dbRole = "ADMIN";
			}

			currentDbUser = await prisma.user.create({
				data: {
					id: userId,
					email: clerkUser.emailAddresses[0]?.emailAddress || "",
					name:
						`${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
						null,
					role: dbRole,
				},
			});
		}

		const searchParams = req.nextUrl.searchParams;
		const role = searchParams.get("role") as
			| "USER"
			| "ADMIN"
			| "SUPER_ADMIN"
			| null;
		const search = searchParams.get("search");
		const isBanned = searchParams.get("isBanned");

		// Build where clause
		const where: any = {};
		if (role) where.role = role;
		if (search) {
			where.OR = [
				{ email: { contains: search, mode: "insensitive" } },
				{ name: { contains: search, mode: "insensitive" } },
			];
		}
		if (isBanned !== null && isBanned !== undefined) {
			where.isBanned = isBanned === "true";
		}

		// Fetch users with activity stats
		const users = await prisma.user.findMany({
			where,
			include: {
				_count: {
					select: {
						activityLogs: true,
						predictionLogs: true,
						downloadLogs: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		// Get last activity for each user
		const usersWithStats = await Promise.all(
			users.map(async (user) => {
				const lastActivity = await prisma.activityLog.findFirst({
					where: { userId: user.id },
					orderBy: { createdAt: "desc" },
					select: { activityType: true, createdAt: true },
				});

				return {
					...user,
					stats: {
						totalActivities: user._count.activityLogs,
						totalPredictions: user._count.predictionLogs,
						totalDownloads: user._count.downloadLogs,
					},
					lastActivity,
					_count: undefined, // Remove the _count field
				};
			})
		);

		return NextResponse.json({ users: usersWithStats });
	} catch (error) {
		console.error("Error fetching users:", error);
		return NextResponse.json(
			{ error: "Failed to fetch users" },
			{ status: 500 }
		);
	}
}

// POST /api/admin/users - Sync user from Clerk or update role
export async function POST(req: NextRequest) {
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
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const body = await req.json();
		const { targetUserId, action, role, bannedReason } = body;

		if (!targetUserId || !action) {
			return NextResponse.json(
				{ error: "targetUserId and action are required" },
				{ status: 400 }
			);
		}

		// Fetch target user from Clerk
		const clerk = await clerkClient();
		const targetClerkUser = await clerk.users.getUser(targetUserId);

		if (!targetClerkUser) {
			return NextResponse.json(
				{ error: "User not found in Clerk" },
				{ status: 404 }
			);
		}

		let updatedUser;

		switch (action) {
			case "sync":
				// Sync or create user
				updatedUser = await prisma.user.upsert({
					where: { id: targetUserId },
					update: {
						email: targetClerkUser.emailAddresses[0]?.emailAddress || "",
						name:
							`${targetClerkUser.firstName || ""} ${
								targetClerkUser.lastName || ""
							}`.trim() || null,
						lastActiveAt: new Date(),
					},
					create: {
						id: targetUserId,
						email: targetClerkUser.emailAddresses[0]?.emailAddress || "",
						name:
							`${targetClerkUser.firstName || ""} ${
								targetClerkUser.lastName || ""
							}`.trim() || null,
						role: "USER",
					},
				});
				break;

			case "updateRole":
				if (!role || !["USER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
					return NextResponse.json({ error: "Invalid role" }, { status: 400 });
				}

				// Prevent demoting yourself
				if (targetUserId === userId) {
					return NextResponse.json(
						{ error: "Cannot change your own role" },
						{ status: 400 }
					);
				}

				// Get current role before update
				const userBeforeUpdate = await prisma.user.findUnique({
					where: { id: targetUserId },
					select: { role: true },
				});

				updatedUser = await prisma.user.update({
					where: { id: targetUserId },
					data: { role },
				});

				// Log activity
				await prisma.activityLog.create({
					data: {
						userId: userId,
						activityType: "USER_PROMOTED",
						description: `Changed role of ${updatedUser.email} to ${role}`,
						metadata: {
							targetUserId,
							oldRole: userBeforeUpdate?.role || "USER",
							newRole: role,
						},
					},
				});
				break;

			case "ban":
				if (targetUserId === userId) {
					return NextResponse.json(
						{ error: "Cannot ban yourself" },
						{ status: 400 }
					);
				}

				updatedUser = await prisma.user.update({
					where: { id: targetUserId },
					data: {
						isBanned: true,
						bannedReason: bannedReason || "No reason provided",
						bannedAt: new Date(),
					},
				});

				await prisma.activityLog.create({
					data: {
						userId: userId,
						activityType: "USER_BANNED",
						description: `Banned ${updatedUser.email}`,
						metadata: { targetUserId, reason: bannedReason },
					},
				});
				break;

			case "unban":
				updatedUser = await prisma.user.update({
					where: { id: targetUserId },
					data: {
						isBanned: false,
						bannedReason: null,
						bannedAt: null,
					},
				});

				await prisma.activityLog.create({
					data: {
						userId: userId,
						activityType: "USER_UNBANNED",
						description: `Unbanned ${updatedUser.email}`,
						metadata: { targetUserId },
					},
				});
				break;

			default:
				return NextResponse.json({ error: "Invalid action" }, { status: 400 });
		}

		return NextResponse.json({ user: updatedUser });
	} catch (error) {
		console.error("Error managing user:", error);
		return NextResponse.json(
			{ error: "Failed to manage user" },
			{ status: 500 }
		);
	}
}
