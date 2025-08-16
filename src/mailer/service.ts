import type EmailService from "@/app/email/email.service";
import type EmailTemplateService from "@/app/emailTemplate/emailTemplate.service";

import { EmailSMTPService } from "@/mailer/config";
import { type TemplateDataType } from "@/mailer/schema";

interface SendEmailWithTemplate {
	emailTemplateService: EmailTemplateService;
	emailService: EmailService;
	templateName: string;
	emailConfigName: string;
	to: string;
	templateData?: TemplateDataType; // Dynamic data for template
	subject?: string; // Optional override for subject
}

interface SendEmailWithDirectTemplate {
	to: string;
	subject: string;
	templateHtml: string;
	templateData?: TemplateDataType;
	from?: string;
	name?: string;
	emailServiceInstance?: EmailSMTPService;
}

// Environment-based configuration factory
export function createEmailService(): EmailSMTPService {
	const config = {
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT,
		secure: process.env.SMTP_PORT === 465, // true for 465, false for 587
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASSWORD
		}
		// Optional: uncomment if using a service like Gmail
		// service: process.env.EMAIL_SERVICE, // 'gmail'
	};

	return new EmailSMTPService(config);
}

export async function sendEmailWithTemplate(config: SendEmailWithTemplate): Promise<void> {
	try {
		// Retrieve email template
		const template = await config.emailTemplateService.retrieveEmailTemplate(config.templateName);
		if (!template?.data) {
			throw new Error(`Email template '${config.templateName}' not found or has no data`);
		}

		// Retrieve email service configuration
		const emailService = await config.emailService.retrieveOneByConfigName(config.emailConfigName);
		if (!emailService?.data) {
			throw new Error(
				`Email service configuration '${config.emailConfigName}' not found or has no data`
			);
		}

		// Create email service instance
		const emailServiceInstance = createEmailService();

		// Send the email using the template with dynamic data
		const result = await emailServiceInstance.sendEmail({
			to: config.to,
			subject: config.subject || template.data.subject, // Allow subject override
			templateHtml: template.data.html, // HTML template from server
			templateData: config.templateData, // Dynamic data
			from: emailService.data.fromEmail,
			name: emailService.data.fromName
		});

		if (!result.success) {
			throw new Error(result.error || "Failed to send email");
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(
			`Failed to send email with template '${config.templateName}' to '${config.to}': ${errorMessage}`
		);
	}
}

// Helper function to send email with direct template HTML
export async function sendEmailWithDirectTemplate({
	to,
	subject,
	templateHtml,
	templateData,
	from,
	name,
	emailServiceInstance
}: SendEmailWithDirectTemplate): Promise<void> {
	const service = emailServiceInstance || createEmailService();

	const result = await service.sendEmail({
		to,
		subject,
		templateHtml,
		templateData,
		from,
		name
	});

	if (!result.success) {
		throw new Error(result.error || "Failed to send email");
	}
}
