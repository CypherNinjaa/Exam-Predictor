"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
	size?: "sm" | "md" | "lg";
	isLoading?: boolean;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant = "primary",
			size = "md",
			isLoading = false,
			leftIcon,
			rightIcon,
			children,
			disabled,
			...props
		},
		ref
	) => {
		const baseStyles =
			"inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";

		const variants = {
			primary:
				"bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 focus:ring-violet-500 shadow-lg shadow-violet-500/25",
			secondary:
				"bg-white/10 text-white hover:bg-white/20 focus:ring-white/50 border border-white/10",
			ghost:
				"text-gray-400 hover:text-white hover:bg-white/10 focus:ring-white/50",
			outline:
				"border border-violet-500/50 text-violet-400 hover:bg-violet-500/10 focus:ring-violet-500",
			danger:
				"bg-red-600 text-white hover:bg-red-500 focus:ring-red-500 shadow-lg shadow-red-500/25",
		};

		const sizes = {
			sm: "text-sm px-3 py-1.5 rounded-lg gap-1.5",
			md: "text-sm px-4 py-2.5 rounded-xl gap-2",
			lg: "text-base px-6 py-3 rounded-xl gap-2",
		};

		return (
			<button
				ref={ref}
				className={cn(baseStyles, variants[variant], sizes[size], className)}
				disabled={disabled || isLoading}
				{...props}
			>
				{isLoading ? (
					<svg
						className="animate-spin h-4 w-4"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						/>
					</svg>
				) : (
					leftIcon
				)}
				{children}
				{!isLoading && rightIcon}
			</button>
		);
	}
);

Button.displayName = "Button";
