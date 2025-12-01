"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
	const pathname = usePathname();

	const navItems = [
		{ href: "/", label: "Home", icon: "🏠" },
		{ href: "/dashboard", label: "Dashboard", icon: "📊" },
		{ href: "/upload", label: "Upload", icon: "📤" },
		{ href: "/predict", label: "Predict", icon: "🔮" },
	];

	return (
		<nav className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
			<div className="container mx-auto px-4">
				<div className="flex items-center justify-between h-16">
					<Link href="/" className="flex items-center gap-2">
						<span className="text-2xl">🎯</span>
						<span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
							AI Exam Predictor
						</span>
					</Link>

					<div className="flex items-center gap-1">
						{navItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-sm
                  ${
										pathname === item.href
											? "bg-purple-600 text-white"
											: "text-gray-300 hover:bg-white/10 hover:text-white"
									}`}
							>
								<span>{item.icon}</span>
								<span className="hidden sm:inline">{item.label}</span>
							</Link>
						))}
					</div>
				</div>
			</div>
		</nav>
	);
}
