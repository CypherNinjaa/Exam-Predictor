import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: "default" | "glass" | "gradient";
	hover?: boolean;
}

export function Card({
	className,
	variant = "default",
	hover = false,
	children,
	...props
}: CardProps) {
	const variants = {
		default: "bg-gray-900/50 border border-white/10",
		glass: "bg-white/5 backdrop-blur-xl border border-white/10",
		gradient:
			"bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20",
	};

	return (
		<div
			className={cn(
				"rounded-2xl p-6 transition-all duration-300",
				variants[variant],
				hover &&
					"hover:border-violet-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10",
				className
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export function CardHeader({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn("mb-4", className)} {...props}>
			{children}
		</div>
	);
}

export function CardTitle({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h3
			className={cn("text-lg font-semibold text-white", className)}
			{...props}
		>
			{children}
		</h3>
	);
}

export function CardDescription({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p className={cn("text-sm text-gray-400 mt-1", className)} {...props}>
			{children}
		</p>
	);
}

export function CardContent({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn("", className)} {...props}>
			{children}
		</div>
	);
}

export function CardFooter({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("mt-4 pt-4 border-t border-white/10", className)}
			{...props}
		>
			{children}
		</div>
	);
}
