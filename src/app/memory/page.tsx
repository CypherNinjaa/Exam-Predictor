"use client";

import React from "react";
import { Navbar, BottomNav, MobileHeader } from "@/components/layout";
import MemoryManager from "@/components/memory/MemoryManager";

export const dynamic = "force-dynamic";

export default function MemoryPage() {
	return (
		<div className="min-h-screen bg-background text-white">
			<Navbar />
			<MobileHeader />

			<div className="container mx-auto px-4 pt-24 pb-24 md:pb-8">
				<MemoryManager />
			</div>

			<BottomNav />
		</div>
	);
}
