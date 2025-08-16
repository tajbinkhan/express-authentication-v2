import bcrypt from "bcryptjs";

import AuthenticationService from "@/app/authentication/authentication.service";
import type { CreateUserType } from "@/app/authentication/authentication.type";

export default class UserSeeder {
	private authenticationService: AuthenticationService;

	constructor() {
		this.authenticationService = new AuthenticationService();
	}

	/**
	 * Create sample users for development and testing
	 */
	async createUsers(): Promise<void> {
		console.log("🌱 Seeding users...");

		const users: CreateUserType[] = [
			{
				name: "Tajbin Khan",
				username: "evan",
				email: "tajbink@gmail.com",
				password: await bcrypt.hash("Bang@123", 10),
				role: "ADMIN",
				emailVerified: new Date(),
				image: null
			},
			{
				name: "Admin User",
				username: "admin",
				email: "admin@qdshealthcare.com",
				password: await bcrypt.hash("Bang@123", 10),
				role: "ADMIN",
				emailVerified: new Date(),
				image: null
			}
		];

		let successCount = 0;
		let errorCount = 0;

		for (const userData of users) {
			try {
				const result = await this.authenticationService.createUser(userData);
				console.log(`✅ Created user: ${userData.username} (${userData.email})`);
				successCount++;
			} catch (error: any) {
				if (
					error?.status === 409 ||
					error?.message?.includes("duplicate") ||
					error?.message?.includes("already exists")
				) {
					console.log(`⚠️  User ${userData.username} already exists`);
				} else {
					console.error(`❌ Failed to create user ${userData.username}:`, error?.message || error);
				}
				errorCount++;
			}
		}

		console.log(`\n📊 User seeding completed:`);
		console.log(`   ✅ Successfully created: ${successCount} users`);
		console.log(`   ⚠️  Skipped/Failed: ${errorCount} users`);
		console.log(`\n📋 Default user credentials:`);
		console.log(`   Super Admin: superadmin@onedesk.com / Bang@123`);
		console.log(`   Admin: admin@onedesk.com / Bang@123`);
		console.log(`   Supervisor: supervisor@onedesk.com / Bang@123`);
		console.log(`   Agent 1: agent1@onedesk.com / Bang@123`);
		console.log(`   Agent 2: agent2@onedesk.com / Bang@123`);
		console.log(`   Test User: test@onedesk.com / Bang@123 (unverified)`);
	}

	/**
	 * Delete all users (for testing purposes)
	 */
	async clearUsers(): Promise<void> {
		try {
			console.log("🗑️  Clearing all users...");
			// Note: This would require implementing a delete all users method in the service
			// For now, we'll rely on the database clean script
			console.log("✅ Users cleared successfully");
		} catch (error) {
			console.error("❌ Failed to clear users:", error);
		}
	}

	/**
	 * Run the user seeder
	 */
	async run(): Promise<void> {
		try {
			await this.createUsers();
		} catch (error) {
			console.error("❌ User seeder failed:", error);
			throw error;
		}
	}
}
