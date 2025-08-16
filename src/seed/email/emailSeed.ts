import { eq } from "drizzle-orm";

import DrizzleService from "@/databases/drizzle/service";
import { email } from "@/models/drizzle/email.model";

interface EmailConfigData {
	emailConfigName: string;
	host: string;
	port: number;
	username: string;
	password: string;
	secure: boolean;
	fromName: string;
	fromEmail: string;
}

export default class EmailSeeder extends DrizzleService {
	/**
	 * Create default email configurations
	 */
	async createEmailConfigurations(): Promise<void> {
		console.log("📧 Seeding email configurations...");

		const emailConfigs: EmailConfigData[] = [
			{
				emailConfigName: "default_smtp",
				host: process.env.SMTP_HOST,
				port: process.env.SMTP_PORT,
				username: process.env.SMTP_USER,
				password: process.env.SMTP_PASSWORD,
				secure: process.env.SMTP_PORT === 465, // true for 465, false for 587
				fromName: "Webphics",
				fromEmail: "info@webphics.com"
			},
			{
				emailConfigName: "notifications",
				host: process.env.SMTP_HOST,
				port: process.env.SMTP_PORT,
				username: process.env.SMTP_USER,
				password: process.env.SMTP_PASSWORD,
				secure: process.env.SMTP_PORT === 465, // true for 465, false for 587
				fromName: "Webphics",
				fromEmail: "info@webphics.com"
			},
			{
				emailConfigName: "support",
				host: process.env.SMTP_HOST,
				port: process.env.SMTP_PORT,
				username: process.env.SMTP_USER,
				password: process.env.SMTP_PASSWORD,
				secure: process.env.SMTP_PORT === 465, // true for 465, false for 587
				fromName: "Webphics",
				fromEmail: "info@webphics.com"
			}
		];

		let createdCount = 0;
		let skippedCount = 0;

		for (const config of emailConfigs) {
			try {
				// Check if email config already exists
				const existingConfig = await this.db
					.select()
					.from(email)
					.where(eq(email.emailConfigName, config.emailConfigName))
					.limit(1);

				if (existingConfig.length > 0) {
					console.log(`  ⚠️  Email config "${config.emailConfigName}" already exists, skipping...`);
					skippedCount++;
					continue;
				}

				// Create the email configuration
				await this.db.insert(email).values(config);

				console.log(`  ✅ Created email config: ${config.emailConfigName}`);
				createdCount++;
			} catch (error) {
				console.error(`  ❌ Failed to create email config "${config.emailConfigName}":`, error);
				throw error;
			}
		}

		console.log(`📧 Email configuration seeding completed:`);
		console.log(`  - Created: ${createdCount} configurations`);
		console.log(`  - Skipped: ${skippedCount} configurations (already exist)`);
	}

	/**
	 * Clear all email configurations (for development/testing)
	 */
	async clearEmailConfigurations(): Promise<void> {
		console.log("🧹 Clearing email configurations...");

		try {
			const result = await this.db.delete(email);
			console.log(`✅ Cleared all email configurations`);
		} catch (error) {
			console.error("❌ Failed to clear email configurations:", error);
			throw error;
		}
	}

	/**
	 * Update existing email configurations with environment variables
	 */
	async updateEmailConfigurations(): Promise<void> {
		console.log("🔄 Updating email configurations with current environment variables...");

		const emailConfigs = ["default_smtp", "notifications", "support"];
		let updatedCount = 0;

		for (const configName of emailConfigs) {
			try {
				const updateData = {
					host: process.env.SMTP_HOST,
					port: process.env.SMTP_PORT,
					username: process.env.SMTP_USER || `${configName}@example.com`,
					password: process.env.SMTP_PASSWORD,
					secure: process.env.SMTP_PORT === 465, // true for 465, false for 587
					fromEmail: process.env.SMTP_USER || `${configName}@example.com`,
					updatedAt: new Date()
				};

				const result = await this.db
					.update(email)
					.set(updateData)
					.where(eq(email.emailConfigName, configName));

				console.log(`  ✅ Updated email config: ${configName}`);
				updatedCount++;
			} catch (error) {
				console.error(`  ❌ Failed to update email config "${configName}":`, error);
			}
		}

		console.log(`🔄 Email configuration update completed: ${updatedCount} configurations updated`);
	}

	/**
	 * Main seeder method - creates email configurations if they don't exist
	 */
	async run(): Promise<void> {
		console.log("🚀 Running Email Configuration Seeder...");
		console.log("-".repeat(50));

		try {
			await this.createEmailConfigurations();
			console.log("✅ Email Configuration Seeder completed successfully!");
		} catch (error) {
			console.error("❌ Email Configuration Seeder failed:", error);
			throw error;
		}
	}
}
