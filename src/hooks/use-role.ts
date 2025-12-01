"use client";

import { useUser } from "@clerk/nextjs";

export type UserRole = "admin" | "user";

export interface UserMetadata {
	role?: UserRole;
}

/**
 * Hook to get user role information
 */
export function useRole() {
	const { user, isLoaded } = useUser();

	const metadata = user?.publicMetadata as UserMetadata | undefined;
	const role: UserRole = metadata?.role || "user";
	const isAdmin = role === "admin";

	return {
		role,
		isAdmin,
		isLoaded,
		user,
	};
}
