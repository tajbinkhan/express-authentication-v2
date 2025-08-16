import dotenv from "dotenv";

import EmailTemplateSeeder from "@/seed/emailTemplate/emailTemplateSeed";
import UserSeeder from "@/seed/user/userSeed";

// Load environment variables
dotenv.config();

/**
 * SuperSeeder - Main seeder orchestrator
 *
 * This class manages all individual seeders and runs them in the correct order.
 * It serves as the central entry point for seeding the database with initial data.
 */
export default class SuperSeeder {
	private userSeeder: UserSeeder;
	private emailTemplateSeeder: EmailTemplateSeeder;

	constructor() {
		this.userSeeder = new UserSeeder();
		this.emailTemplateSeeder = new EmailTemplateSeeder();
	}

	/**
	 * Run all seeders in the correct order
	 */
	async runAll(): Promise<void> {
		console.log("🚀 Starting SuperSeeder...");
		console.log("=" + "=".repeat(50) + "=");

		const startTime = Date.now();

		try {
			// Seed email templates (as they might be needed by user notifications)
			await this.emailTemplateSeeder.run();

			// Seed users (as they are typically required by other entities)
			await this.userSeeder.run();

			// Add other seeders here in the future
			// Example:
			// await this.projectSeeder.run();

			const endTime = Date.now();
			const duration = (endTime - startTime) / 1000;

			console.log("=" + "=".repeat(50) + "=");
			console.log(`✅ SuperSeeder completed successfully in ${duration}s`);
			console.log("🎉 Database seeding finished!");
		} catch (error) {
			console.error("❌ SuperSeeder failed:", error);
			throw error;
		}
	}

	/**
	 * Run only user seeder
	 */
	async runUserSeeder(): Promise<void> {
		console.log("🚀 Running User Seeder only...");
		try {
			await this.userSeeder.run();
			console.log("✅ User Seeder completed successfully!");
		} catch (error) {
			console.error("❌ User Seeder failed:", error);
			throw error;
		}
	}

	/**
	 * Run only email template seeder
	 */
	async runEmailTemplateSeeder(): Promise<void> {
		console.log("🚀 Running Email Template Seeder only...");
		try {
			await this.emailTemplateSeeder.run();
			console.log("✅ Email Template Seeder completed successfully!");
		} catch (error) {
			console.error("❌ Email Template Seeder failed:", error);
			throw error;
		}
	}

	/**
	 * Clear all seeded data (for development/testing)
	 */
	async clearAll(): Promise<void> {
		console.log("🧹 Clearing all seeded data...");
		try {
			await this.userSeeder.clearUsers();
			await this.emailTemplateSeeder.clearEmailTemplates();
			console.log("✅ All seeded data cleared successfully!");
		} catch (error) {
			console.error("❌ Failed to clear seeded data:", error);
			throw error;
		}
	}
}

/**
 * CLI execution
 * This allows the seeder to be run directly from the command line
 */
if (require.main === module) {
	const superSeeder = new SuperSeeder();

	const args = process.argv.slice(2);
	const command = args[0] || "all";

	const runSeeder = async () => {
		try {
			switch (command.toLowerCase()) {
				case "all":
				case "run":
					await superSeeder.runAll();
					break;
				case "users":
				case "user":
					await superSeeder.runUserSeeder();
					break;
				case "emails":
				case "email":
				case "templates":
					await superSeeder.runEmailTemplateSeeder();
					break;
				case "clear":
					await superSeeder.clearAll();
					break;
				default:
					console.log("Usage: npm run db:seed [all|languages|users|emails|clear]");
					console.log("  all (default) - Run all seeders");
					console.log("  languages     - Run only language seeder");
					console.log("  users         - Run only user seeder");
					console.log("  emails        - Run only email template seeder");
					console.log("  clear         - Clear all seeded data");
					break;
			}
			process.exit(0);
		} catch (error) {
			console.error("Seeder execution failed:", error);
			process.exit(1);
		}
	};

	runSeeder();
}
