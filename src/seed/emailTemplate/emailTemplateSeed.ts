import { eq } from "drizzle-orm";

import DrizzleService from "@/databases/drizzle/service";
import { emailTemplates } from "@/models/drizzle/emailTemplate.model";

interface EmailTemplateData {
	name: string;
	subject: string;
	html: string;
}

export default class EmailTemplateSeeder extends DrizzleService {
	/**
	 * Create default email templates
	 */
	async createEmailTemplates(): Promise<void> {
		console.log("📧 Seeding email templates...");

		const templates: EmailTemplateData[] = [
			{
				name: "login_otp",
				subject: "Webphics - Login Verification Code",
				html: `
					<!DOCTYPE html>
					<html>
					<head>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Login Verification Code</title>
						<style>
							body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
							.container { background-color: #f9f9f9; padding: 30px; border-radius: 10px; border: 1px solid #ddd; }
							.header { text-align: center; margin-bottom: 30px; }
							.logo { font-size: 24px; font-weight: bold; color: #2c5aa0; }
							.otp-box { background-color: #2c5aa0; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
							.otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 10px 0; }
							.footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
						</style>
					</head>
					<body>
						<div class="container">
							<div class="header">
								<div class="logo">Webphics</div>
							</div>

							<h2>Hello {{username}},</h2>

							<p>We received a request to log into your Webphics account. To complete your login, please use the verification code below:</p>

							<div class="otp-box">
								<div>Your verification code is:</div>
								<div class="otp-code">{{otp}}</div>
							</div>

							<p><strong>Important:</strong> This code will expire in {{otpExpirationTime}} minutes. If you didn't request this login, please ignore this email and contact our support team.</p>

							<p>For your security, never share this code with anyone.</p>

							<p>Best regards,<br>The Webphics Team</p>

							<div class="footer">
								<p>This is an automated message, please do not reply to this email.</p>
								<p>&copy; 2025 Webphics. All rights reserved.</p>
							</div>
						</div>
					</body>
					</html>
				`
			},
			{
				name: "password_reset",
				subject: "Webphics - Password Reset Request",
				html: `
					<!DOCTYPE html>
					<html>
					<head>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Password Reset Request</title>
						<style>
							body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
							.container { background-color: #f9f9f9; padding: 30px; border-radius: 10px; border: 1px solid #ddd; }
							.header { text-align: center; margin-bottom: 30px; }
							.logo { font-size: 24px; font-weight: bold; color: #2c5aa0; }
							.otp-box { background-color: #e74c3c; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
							.otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 10px 0; }
							.footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
						</style>
					</head>
					<body>
						<div class="container">
							<div class="header">
								<div class="logo">Webphics</div>
							</div>

							<h2>Hello {{username}},</h2>

							<p>We received a request to reset your Webphics account password. To proceed with the password reset, please use the verification code below:</p>

							<div class="otp-box">
								<div>Your password reset code is:</div>
								<div class="otp-code">{{otp}}</div>
							</div>

							<p><strong>Important:</strong> This code will expire in {{otpExpirationTime}} minutes. If you didn't request this password reset, please ignore this email and contact our support team immediately.</p>

							<p>For your security, never share this code with anyone.</p>

							<p>Best regards,<br>The Webphics Team</p>

							<div class="footer">
								<p>This is an automated message, please do not reply to this email.</p>
								<p>&copy; 2025 Webphics. All rights reserved.</p>
							</div>
						</div>
					</body>
					</html>
				`
			},
			{
				name: "email_verification",
				subject: "Webphics - Verify Your Email Address",
				html: `
					<!DOCTYPE html>
					<html>
					<head>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Verify Your Email Address</title>
						<style>
							body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
							.container { background-color: #f9f9f9; padding: 30px; border-radius: 10px; border: 1px solid #ddd; }
							.header { text-align: center; margin-bottom: 30px; }
							.logo { font-size: 24px; font-weight: bold; color: #2c5aa0; }
							.otp-box { background-color: #27ae60; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
							.otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 10px 0; }
							.footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
						</style>
					</head>
					<body>
						<div class="container">
							<div class="header">
								<div class="logo">Webphics</div>
							</div>

							<h2>Welcome to Webphics, {{username}}!</h2>

							<p>Thank you for registering with Webphics. To complete your account setup, please verify your email address using the code below:</p>

							<div class="otp-box">
								<div>Your verification code is:</div>
								<div class="otp-code">{{otp}}</div>
							</div>

							<p><strong>Important:</strong> This code will expire in {{otpExpirationTime}} minutes. If you didn't create this account, please ignore this email.</p>

							<p>Once verified, you'll have full access to all Webphics features!</p>

							<p>Best regards,<br>The Webphics Team</p>

							<div class="footer">
								<p>This is an automated message, please do not reply to this email.</p>
								<p>&copy; 2025 Webphics. All rights reserved.</p>
							</div>
						</div>
					</body>
					</html>
				`
			},
			{
				name: "welcome",
				subject: "Welcome to Webphics!",
				html: `
					<!DOCTYPE html>
					<html>
					<head>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Welcome to Webphics</title>
						<style>
							body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
							.container { background-color: #f9f9f9; padding: 30px; border-radius: 10px; border: 1px solid #ddd; }
							.header { text-align: center; margin-bottom: 30px; }
							.logo { font-size: 24px; font-weight: bold; color: #2c5aa0; }
							.welcome-box { background-color: #2c5aa0; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
							.features { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
							.feature-item { margin: 10px 0; }
							.footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
						</style>
					</head>
					<body>
						<div class="container">
							<div class="header">
								<div class="logo">Webphics</div>
							</div>

							<div class="welcome-box">
								<h2>Welcome aboard, {{username}}! 🎉</h2>
								<p>Your Webphics account is now active and ready to use.</p>
							</div>

							<p>Thank you for joining Webphics! We're excited to have you as part of our community.</p>

							<div class="features">
								<h3>Here's what you can do with Webphics:</h3>
								<div class="feature-item">✅ Manage your tasks efficiently</div>
								<div class="feature-item">📊 Track your productivity</div>
								<div class="feature-item">👥 Collaborate with your team</div>
								<div class="feature-item">📈 Monitor your progress</div>
								<div class="feature-item">🔐 Secure authentication system</div>
							</div>

							<p>To get started, simply log in to your account and begin exploring all the features we have to offer.</p>

							<p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>

							<p>Best regards,<br>The Webphics Team</p>

							<div class="footer">
								<p>This is an automated message, please do not reply to this email.</p>
								<p>&copy; 2025 Webphics. All rights reserved.</p>
							</div>
						</div>
					</body>
					</html>
				`
			}
		];

		let successCount = 0;
		let errorCount = 0;

		for (const template of templates) {
			try {
				// Check if template already exists
				const existingTemplate = await this.getDb().query.emailTemplates.findFirst({
					where: eq(emailTemplates.name, template.name)
				});

				if (existingTemplate) {
					// Update existing template
					await this.getDb()
						.update(emailTemplates)
						.set({
							subject: template.subject,
							html: template.html
						})
						.where(eq(emailTemplates.name, template.name));
					console.log(`🔄 Updated email template: ${template.name}`);
				} else {
					// Create new template
					await this.getDb().insert(emailTemplates).values(template);
					console.log(`✅ Created email template: ${template.name}`);
				}
				successCount++;
			} catch (error: any) {
				console.error(
					`❌ Failed to create/update email template ${template.name}:`,
					error?.message || error
				);
				errorCount++;
			}
		}

		console.log(`\n📊 Email template seeding completed:`);
		console.log(`   ✅ Successfully created/updated: ${successCount} templates`);
		console.log(`   ❌ Failed: ${errorCount} templates`);
		console.log(`\n📧 Available email templates:`);
		templates.forEach(template => {
			console.log(`   - ${template.name}: ${template.subject}`);
		});
	}

	/**
	 * Delete all email templates (for testing purposes)
	 */
	async clearEmailTemplates(): Promise<void> {
		try {
			console.log("🗑️  Clearing all email templates...");
			await this.getDb().delete(emailTemplates);
			console.log("✅ Email templates cleared successfully");
		} catch (error) {
			console.error("❌ Failed to clear email templates:", error);
		}
	}

	/**
	 * Run the email template seeder
	 */
	async run(): Promise<void> {
		try {
			await this.createEmailTemplates();
		} catch (error) {
			console.error("❌ Email template seeder failed:", error);
			throw error;
		}
	}
}
