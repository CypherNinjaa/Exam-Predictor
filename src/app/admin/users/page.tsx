"use client";

import { useState, useEffect } from "react";
import {
	Users as UsersIcon,
	Search,
	Shield,
	Ban,
	CheckCircle,
	Activity,
} from "lucide-react";
import { Button, Card, Input, Badge } from "@/components/ui";
import { toast } from "@/hooks/use-toast";

type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

interface User {
	id: string;
	email: string;
	name: string | null;
	role: UserRole;
	isBanned: boolean;
	bannedReason: string | null;
	lastActiveAt: string;
	createdAt: string;
	stats: {
		totalActivities: number;
		totalPredictions: number;
		totalDownloads: number;
	};
	lastActivity?: {
		activityType: string;
		createdAt: string;
	} | null;
}

const roleColors: Record<UserRole, string> = {
	USER: "default",
	ADMIN: "violet",
	SUPER_ADMIN: "purple",
};

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
	const [bannedFilter, setBannedFilter] = useState<"all" | "active" | "banned">(
		"all"
	);
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	// Auto-sync current user on mount
	useEffect(() => {
		const syncCurrentUser = async () => {
			try {
				await fetch("/api/user/sync");
			} catch (error) {
				console.error("Failed to sync user:", error);
			}
		};
		syncCurrentUser();
	}, []);

	useEffect(() => {
		fetchUsers();
	}, [roleFilter, bannedFilter]);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams();
			if (roleFilter !== "ALL") params.append("role", roleFilter);
			if (bannedFilter !== "all") {
				params.append("isBanned", bannedFilter === "banned" ? "true" : "false");
			}

			const res = await fetch(`/api/admin/users?${params}`);
			if (!res.ok) throw new Error("Failed to fetch users");

			const data = await res.json();
			setUsers(data.users);
		} catch (error) {
			console.error("Error fetching users:", error);
			toast({
				variant: "error",
				title: "Error",
				description: "Failed to fetch users. Please try again.",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleAction = async (
		userId: string,
		action: string,
		role?: UserRole,
		bannedReason?: string
	) => {
		try {
			setActionLoading(userId);

			const res = await fetch("/api/admin/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					targetUserId: userId,
					action,
					role,
					bannedReason,
				}),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to perform action");
			}

			const data = await res.json();

			// Update user in state
			setUsers((prev) =>
				prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u))
			);

			toast({
				variant: "success",
				title: "Success",
				description: `User ${action} successfully.`,
			});

			await fetchUsers(); // Refresh list
		} catch (error: any) {
			console.error("Error performing action:", error);
			toast({
				variant: "error",
				title: "Error",
				description: error.message || "Failed to perform action.",
			});
		} finally {
			setActionLoading(null);
		}
	};

	const filteredUsers = users.filter((user) => {
		const matchesSearch =
			user.email.toLowerCase().includes(search.toLowerCase()) ||
			user.name?.toLowerCase().includes(search.toLowerCase());
		return matchesSearch;
	});

	const stats = {
		total: users.length,
		active: users.filter((u) => !u.isBanned).length,
		banned: users.filter((u) => u.isBanned).length,
		admins: users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN")
			.length,
	};

	return (
		<div className="min-h-screen bg-background p-6">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-2">
					<div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30">
						<UsersIcon className="w-6 h-6 text-violet-400" />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-white">Users Management</h1>
						<p className="text-gray-400 mt-1">
							Manage users, roles, and permissions
						</p>
					</div>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<Card className="p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-400 text-sm">Total Users</p>
							<p className="text-2xl font-bold text-white">{stats.total}</p>
						</div>
						<UsersIcon className="w-8 h-8 text-violet-500" />
					</div>
				</Card>

				<Card className="p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-400 text-sm">Active Users</p>
							<p className="text-2xl font-bold text-green-400">
								{stats.active}
							</p>
						</div>
						<CheckCircle className="w-8 h-8 text-green-500" />
					</div>
				</Card>

				<Card className="p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-400 text-sm">Banned Users</p>
							<p className="text-2xl font-bold text-red-400">{stats.banned}</p>
						</div>
						<Ban className="w-8 h-8 text-red-500" />
					</div>
				</Card>

				<Card className="p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-400 text-sm">Admins</p>
							<p className="text-2xl font-bold text-purple-400">
								{stats.admins}
							</p>
						</div>
						<Shield className="w-8 h-8 text-purple-500" />
					</div>
				</Card>
			</div>

			{/* Filters */}
			<Card className="p-4 mb-6">
				<div className="flex flex-col md:flex-row gap-4">
					{/* Search */}
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
						<Input
							type="text"
							placeholder="Search by email or name..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-10"
						/>
					</div>

					{/* Role Filter */}
					<select
						value={roleFilter}
						onChange={(e) => setRoleFilter(e.target.value as UserRole | "ALL")}
						className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-violet-500 focus:outline-none"
					>
						<option value="ALL">All Roles</option>
						<option value="USER">Users</option>
						<option value="ADMIN">Admins</option>
						<option value="SUPER_ADMIN">Super Admins</option>
					</select>

					{/* Status Filter */}
					<select
						value={bannedFilter}
						onChange={(e) =>
							setBannedFilter(e.target.value as "all" | "active" | "banned")
						}
						className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-violet-500 focus:outline-none"
					>
						<option value="all">All Status</option>
						<option value="active">Active</option>
						<option value="banned">Banned</option>
					</select>
				</div>
			</Card>

			{/* Users Table */}
			{loading ? (
				<Card className="p-12 text-center">
					<div className="animate-pulse">
						<div className="h-4 bg-gray-700 rounded w-1/4 mx-auto mb-4"></div>
						<div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
					</div>
				</Card>
			) : filteredUsers.length === 0 ? (
				<Card className="p-12 text-center">
					<UsersIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
					<h3 className="text-xl font-semibold text-white mb-2">
						No users found
					</h3>
					<p className="text-gray-400">
						Try adjusting your filters or search query.
					</p>
				</Card>
			) : (
				<Card className="overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-white/5 border-b border-white/10">
								<tr>
									<th className="px-6 py-4 text-left text-sm font-semibold text-white">
										User
									</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-white">
										Role
									</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-white">
										Status
									</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-white">
										Activity
									</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-white">
										Stats
									</th>
									<th className="px-6 py-4 text-right text-sm font-semibold text-white">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-white/10">
								{filteredUsers.map((user) => (
									<tr
										key={user.id}
										className="hover:bg-white/5 transition-colors"
									>
										<td className="px-6 py-4">
											<div>
												<p className="text-white font-medium">
													{user.name || "No name"}
												</p>
												<p className="text-gray-400 text-sm">{user.email}</p>
											</div>
										</td>
										<td className="px-6 py-4">
											<Badge color={roleColors[user.role]}>{user.role}</Badge>
										</td>
										<td className="px-6 py-4">
											{user.isBanned ? (
												<div>
													<Badge color="red">BANNED</Badge>
													{user.bannedReason && (
														<p className="text-xs text-gray-500 mt-1">
															{user.bannedReason}
														</p>
													)}
												</div>
											) : (
												<Badge color="green">ACTIVE</Badge>
											)}
										</td>
										<td className="px-6 py-4">
											<div className="flex items-center gap-2 text-sm">
												<Activity className="w-4 h-4 text-gray-400" />
												<span className="text-gray-400">
													{user.lastActivity
														? new Date(
																user.lastActivity.createdAt
														  ).toLocaleDateString()
														: "No activity"}
												</span>
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="text-sm text-gray-400">
												<div>Predictions: {user.stats.totalPredictions}</div>
												<div>Downloads: {user.stats.totalDownloads}</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="flex items-center justify-end gap-2">
												{/* Role Dropdown */}
												{!user.isBanned && (
													<select
														value={user.role}
														onChange={(e) =>
															handleAction(
																user.id,
																"updateRole",
																e.target.value as UserRole
															)
														}
														disabled={actionLoading === user.id}
														className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-violet-500 focus:outline-none disabled:opacity-50"
													>
														<option value="USER">User</option>
														<option value="ADMIN">Admin</option>
														<option value="SUPER_ADMIN">Super Admin</option>
													</select>
												)}

												{/* Ban/Unban */}
												{user.isBanned ? (
													<Button
														onClick={() => handleAction(user.id, "unban")}
														disabled={actionLoading === user.id}
														variant="ghost"
														className="text-green-400 hover:text-green-300"
													>
														Unban
													</Button>
												) : (
													<Button
														onClick={() => {
															const reason = prompt("Ban reason (optional):");
															if (reason !== null) {
																handleAction(user.id, "ban", undefined, reason);
															}
														}}
														disabled={actionLoading === user.id}
														variant="ghost"
														className="text-red-400 hover:text-red-300"
													>
														Ban
													</Button>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card>
			)}
		</div>
	);
}
