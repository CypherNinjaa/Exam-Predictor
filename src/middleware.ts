import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected routes
const isProtectedRoute = createRouteMatcher([
	"/dashboard(.*)",
	"/upload(.*)",
	"/predict(.*)",
	"/admin(.*)",
]);

// Define admin-only routes
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
	// Protect all dashboard, upload, predict, and admin routes
	if (isProtectedRoute(req)) {
		await auth.protect();
	}

	// For admin routes, check if user has admin role
	if (isAdminRoute(req)) {
		const { userId, sessionClaims } = await auth();

		if (!userId) {
			return NextResponse.redirect(new URL("/sign-in", req.url));
		}

		// Check if user has admin role in publicMetadata
		const role = (sessionClaims?.metadata as { role?: string })?.role;

		if (role !== "admin") {
			// Redirect non-admin users to dashboard
			return NextResponse.redirect(new URL("/dashboard", req.url));
		}
	}

	return NextResponse.next();
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
