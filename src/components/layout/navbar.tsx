"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import {
	Home,
	LayoutDashboard,
	Upload,
	Sparkles,
	Shield,
	LogIn,
	BookText,
	Search,
	MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useSearch } from "@/components/SearchProvider";

const navItems = [
	{ href: "/", label: "Home", icon: Home },
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/notes", label: "Notes", icon: BookText },
	{ href: "/chat", label: "Chat", icon: MessageSquare },
	{ href: "/predict", label: "Predict", icon: Sparkles },
];

export function Navbar() {
	const pathname = usePathname();
	const { user, isLoaded } = useUser();
	const isAdmin = (user?.publicMetadata as { role?: string })?.role === "admin";
	const { openSearch } = useSearch();

	return (
		<header className="fixed top-0 left-0 right-0 z-50 hidden md:block">
			<div className="mx-4 mt-4">
				<nav className="max-w-6xl mx-auto bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3">
					<div className="flex items-center justify-between">
						{/* Logo */}
						<Link href="/" className="flex items-center gap-3">
							<div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
								<Sparkles className="w-5 h-5 text-white" />
							</div>
							<div>
								<h1 className="font-bold text-white">AmityMate.ai</h1>
								<p className="text-[10px] text-gray-500 -mt-0.5">
									Amity University Patna
								</p>
							</div>
						</Link>

						{/* Nav Links */}
						<div className="flex items-center gap-1">
							{navItems.map((item) => {
								const Icon = item.icon;
								const isActive = pathname === item.href;
								return (
									<Link key={item.href} href={item.href}>
										<div
											className={cn(
												"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
												isActive
													? "bg-violet-500/20 text-violet-300"
													: "text-gray-400 hover:text-white hover:bg-white/5"
											)}
										>
											<Icon className="w-4 h-4" />
											<span>{item.label}</span>
										</div>
									</Link>
								);
							})}

							{isLoaded && isAdmin && (
								<>
									<div className="w-px h-6 bg-white/10 mx-2" />
									<Link href="/admin">
										<div
											className={cn(
												"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
												pathname.startsWith("/admin")
													? "bg-amber-500/20 text-amber-300"
													: "text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/10"
											)}
										>
											<Shield className="w-4 h-4" />
											<span>Admin</span>
										</div>
									</Link>
								</>
							)}
						</div>

						{/* Auth */}
						<div className="flex items-center gap-3">
							{/* Search Button */}
							<button
								onClick={openSearch}
								className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
							>
								<Search className="w-4 h-4" />
								<span className="hidden lg:inline">Search</span>
								<kbd className="hidden lg:inline-block px-2 py-0.5 text-xs bg-white/10 border border-white/20 rounded">
									{navigator.platform.includes("Mac") ? "⌘K" : "Ctrl+K"}
								</kbd>
							</button>

							<SignedOut>
								<SignInButton mode="modal">
									<Button size="sm" leftIcon={<LogIn className="w-4 h-4" />}>
										Sign In
									</Button>
								</SignInButton>
							</SignedOut>
							<SignedIn>
								<UserButton
									appearance={{
										elements: {
											avatarBox:
												"w-9 h-9 ring-2 ring-violet-500/50 ring-offset-2 ring-offset-gray-900",
										},
									}}
								/>
							</SignedIn>
						</div>
					</div>
				</nav>
			</div>
		</header>
	);
}
