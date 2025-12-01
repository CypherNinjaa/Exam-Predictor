"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	LayoutDashboard,
	BookOpen,
	FileQuestion,
	GraduationCap,
	Upload,
	Settings,
	ChevronLeft,
	ChevronRight,
	Sparkles,
	Users,
	BarChart3,
	FileText,
	Loader2,
	Brain,
	BookText,
} from "lucide-react";

interface AdminLayoutProps {
	children: React.ReactNode;
}

const sidebarItems = [
	{ href: "/admin", label: "Overview", icon: LayoutDashboard },
	{ href: "/admin/subjects", label: "Subjects", icon: BookOpen },
	{ href: "/admin/syllabi", label: "Syllabi", icon: FileText },
	{ href: "/admin/questions", label: "Questions", icon: FileQuestion },
	{ href: "/admin/exams", label: "Exams", icon: GraduationCap },
	{ href: "/admin/upload", label: "Upload", icon: Upload },
	{ href: "/admin/notes", label: "Notes", icon: BookText },
	{ href: "/admin/predict", label: "Predict", icon: Brain },
	{ href: "/admin/users", label: "Users", icon: Users },
	{ href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
	{ href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
	const { user, isLoaded } = useUser();
	const router = useRouter();
	const pathname = usePathname();
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [isAuthorized, setIsAuthorized] = useState(false);

	useEffect(() => {
		if (isLoaded) {
			const role = (user?.publicMetadata as { role?: string })?.role;
			if (role !== "admin") {
				router.push("/dashboard");
			} else {
				setIsAuthorized(true);
			}
		}
	}, [isLoaded, user, router]);

	if (!isLoaded || !isAuthorized) {
		return (
			<div className="min-h-screen bg-[#0f0f23] flex items-center justify-center">
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="flex flex-col items-center gap-4"
				>
					<Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
					<p className="text-gray-400">Verifying admin access...</p>
				</motion.div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#0f0f23] flex">
			{/* Sidebar */}
			<motion.aside
				initial={false}
				animate={{ width: sidebarOpen ? 260 : 80 }}
				className="fixed left-0 top-0 h-screen bg-[#0a0a1a] border-r border-white/5 z-40 flex flex-col"
			>
				{/* Logo */}
				<div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
					<Link href="/admin" className="flex items-center gap-3">
						<div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
							<Sparkles className="w-5 h-5 text-white" />
						</div>
						{sidebarOpen && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
							>
								<h1 className="font-bold text-white">Admin Panel</h1>
								<p className="text-[10px] text-gray-500">Exam Predictor</p>
							</motion.div>
						)}
					</Link>
				</div>

				{/* Navigation */}
				<nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
					{sidebarItems.map((item) => {
						const Icon = item.icon;
						const isActive =
							pathname === item.href ||
							(item.href !== "/admin" && pathname.startsWith(item.href));

						return (
							<Link key={item.href} href={item.href}>
								<motion.div
									whileHover={{ x: 4 }}
									whileTap={{ scale: 0.98 }}
									className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
										isActive
											? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30"
											: "text-gray-400 hover:text-white hover:bg-white/5"
									}`}
								>
									<Icon
										className={`w-5 h-5 flex-shrink-0 ${
											isActive ? "text-amber-400" : "group-hover:text-amber-400"
										}`}
									/>
									{sidebarOpen && (
										<motion.span
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											className="text-sm font-medium"
										>
											{item.label}
										</motion.span>
									)}
								</motion.div>
							</Link>
						);
					})}
				</nav>

				{/* Collapse button */}
				<div className="p-3 border-t border-white/5">
					<button
						onClick={() => setSidebarOpen(!sidebarOpen)}
						className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
					>
						{sidebarOpen ? (
							<>
								<ChevronLeft className="w-4 h-4" />
								<span className="text-sm">Collapse</span>
							</>
						) : (
							<ChevronRight className="w-4 h-4" />
						)}
					</button>
				</div>
			</motion.aside>

			{/* Main content */}
			<main
				className={`flex-1 transition-all duration-300 ${
					sidebarOpen ? "ml-[260px]" : "ml-[80px]"
				}`}
			>
				{/* Top bar */}
				<header className="h-16 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30 flex items-center justify-between px-6">
					<div>
						<h2 className="text-lg font-semibold text-white">
							{sidebarItems.find(
								(item) =>
									item.href === pathname ||
									(item.href !== "/admin" && pathname.startsWith(item.href))
							)?.label || "Admin"}
						</h2>
					</div>
					<div className="flex items-center gap-3">
						<Link href="/">
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className="btn-secondary !py-2 !px-4 text-sm"
							>
								Back to Site
							</motion.button>
						</Link>
					</div>
				</header>

				{/* Page content */}
				<div className="p-6">{children}</div>
			</main>
		</div>
	);
}
