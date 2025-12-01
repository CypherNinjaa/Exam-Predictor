"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import {
	Home,
	LayoutDashboard,
	Upload,
	Sparkles,
	Shield,
	User,
	BookText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
	{ href: "/", label: "Home", icon: Home },
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/notes", label: "Notes", icon: BookText },
	{ href: "/predict", label: "Predict", icon: Sparkles },
];

export function BottomNav() {
	const pathname = usePathname();
	const { user, isLoaded } = useUser();
	const isAdmin = (user?.publicMetadata as { role?: string })?.role === "admin";

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
			<div className="mx-3 mb-3">
				<div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl px-2 py-2">
					<div className="flex items-center justify-around">
						{navItems.map((item) => {
							const Icon = item.icon;
							const isActive = pathname === item.href;
							return (
								<Link key={item.href} href={item.href} className="flex-1">
									<div
										className={cn(
											"flex flex-col items-center gap-1 py-2 rounded-xl transition-all",
											isActive ? "text-violet-400" : "text-gray-500"
										)}
									>
										<div
											className={cn(
												"p-2 rounded-xl transition-all",
												isActive && "bg-violet-500/20"
											)}
										>
											<Icon className="w-5 h-5" />
										</div>
										<span className="text-[10px] font-medium">
											{item.label}
										</span>
									</div>
								</Link>
							);
						})}

						{/* Profile / Sign In */}
						<div className="flex-1">
							<SignedOut>
								<SignInButton mode="modal">
									<button className="flex flex-col items-center gap-1 py-2 w-full text-gray-500">
										<div className="p-2 rounded-xl">
											<User className="w-5 h-5" />
										</div>
										<span className="text-[10px] font-medium">Sign In</span>
									</button>
								</SignInButton>
							</SignedOut>
							<SignedIn>
								{isLoaded && isAdmin ? (
									<Link href="/admin">
										<div
											className={cn(
												"flex flex-col items-center gap-1 py-2 transition-all",
												pathname.startsWith("/admin")
													? "text-amber-400"
													: "text-gray-500"
											)}
										>
											<div
												className={cn(
													"p-2 rounded-xl transition-all",
													pathname.startsWith("/admin") && "bg-amber-500/20"
												)}
											>
												<Shield className="w-5 h-5" />
											</div>
											<span className="text-[10px] font-medium">Admin</span>
										</div>
									</Link>
								) : (
									<Link href="/profile">
										<div className="flex flex-col items-center gap-1 py-2 text-gray-500">
											<div className="p-2 rounded-xl">
												<User className="w-5 h-5" />
											</div>
											<span className="text-[10px] font-medium">Profile</span>
										</div>
									</Link>
								)}
							</SignedIn>
						</div>
					</div>
				</div>
			</div>
		</nav>
	);
}
