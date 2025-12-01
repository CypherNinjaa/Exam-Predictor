"use server";

import { auth, currentUser } from "@clerk/nextjs/server";

export type UserRole = "admin" | "user";

export interface UserMetadata {
	role?: UserRole;
}

/**
 * Get the current user's role from public metadata
 */
export async function getUserRole(): Promise<UserRole> {
	const user = await currentUser();
	if (!user) return "user";

	const metadata = user.publicMetadata as UserMetadata;
	return metadata?.role || "user";
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
	const role = await getUserRole();
	return role === "admin";
}

/**
 * Get auth info with role
 */
export async function getAuthWithRole() {
	const { userId } = await auth();
	const user = await currentUser();

	if (!userId || !user) {
		return { userId: null, role: "user" as UserRole, isAdmin: false };
	}

	const metadata = user.publicMetadata as UserMetadata;
	const role = metadata?.role || "user";

	return {
		userId,
		role,
		isAdmin: role === "admin",
		user,
	};
}
