"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export function MobileHeader() {
	return (
		<header className="fixed top-0 left-0 right-0 z-50 md:hidden">
			<div className="mx-3 mt-3">
				<div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3">
					<div className="flex items-center justify-between">
						<Link href="/" className="flex items-center gap-2">
							<div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
								<Sparkles className="w-4 h-4 text-white" />
							</div>
							<span className="font-bold text-white text-sm">AmityMate.ai</span>
						</Link>
						<span className="text-[10px] text-gray-500">Amity University</span>
					</div>
				</div>
			</div>
		</header>
	);
}
