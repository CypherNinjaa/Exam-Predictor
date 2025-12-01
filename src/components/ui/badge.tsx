import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
	variant?: "default" | "violet" | "green" | "red" | "yellow" | "blue";
}

export function Badge({
	className,
	variant = "default",
	children,
	...props
}: BadgeProps) {
	const variants = {
		default: "bg-white/10 text-gray-300 border-white/10",
		violet: "bg-violet-500/20 text-violet-300 border-violet-500/30",
		green: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
		red: "bg-red-500/20 text-red-300 border-red-500/30",
		yellow: "bg-amber-500/20 text-amber-300 border-amber-500/30",
		blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
	};

	return (
		<span
			className={cn(
				"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
				variants[variant],
				className
			)}
			{...props}
		>
			{children}
		</span>
	);
}
