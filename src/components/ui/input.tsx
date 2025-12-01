"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, label, error, leftIcon, rightIcon, id, ...props }, ref) => {
		const inputId = id || label?.toLowerCase().replace(/\s/g, "-");

		return (
			<div className="w-full">
				{label && (
					<label
						htmlFor={inputId}
						className="block text-sm font-medium text-gray-300 mb-2"
					>
						{label}
					</label>
				)}
				<div className="relative">
					{leftIcon && (
						<div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
							{leftIcon}
						</div>
					)}
					<input
						ref={ref}
						id={inputId}
						className={cn(
							"w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500",
							"focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
							"transition-all duration-200",
							leftIcon && "pl-10",
							rightIcon && "pr-10",
							error &&
								"border-red-500 focus:border-red-500 focus:ring-red-500/20",
							className
						)}
						{...props}
					/>
					{rightIcon && (
						<div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
							{rightIcon}
						</div>
					)}
				</div>
				{error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
			</div>
		);
	}
);

Input.displayName = "Input";
