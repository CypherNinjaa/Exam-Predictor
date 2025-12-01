import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-[#0f0f23] relative overflow-hidden">
			{/* Animated background */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-600/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
				<div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-pink-600/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse delay-1000" />

				{/* Grid pattern */}
				<div
					className="absolute inset-0 opacity-20"
					style={{
						backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
            `,
						backgroundSize: "50px 50px",
					}}
				/>
			</div>

			{/* Floating particles */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				{[...Array(20)].map((_, i) => (
					<div
						key={i}
						className="absolute w-2 h-2 bg-purple-500/30 rounded-full animate-float"
						style={{
							left: `${Math.random() * 100}%`,
							top: `${Math.random() * 100}%`,
							animationDelay: `${Math.random() * 5}s`,
							animationDuration: `${5 + Math.random() * 10}s`,
						}}
					/>
				))}
			</div>

			<div className="relative z-10">
				<SignIn
					appearance={{
						elements: {
							rootBox: "mx-auto",
							card: "bg-[#0f0f23]/80 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-purple-500/10",
						},
					}}
				/>
			</div>
		</div>
	);
}
