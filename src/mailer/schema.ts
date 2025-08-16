import { z } from "zod";

import {
	validateArray,
	validateBoolean,
	validateEmail,
	validateEmailOrArray,
	validateNumber,
	validateString,
	validateUnion
} from "@/validators/commonRules";

// Template data schema
const templateDataSchema = z.record(z.string(), z.any());

// Configuration schema for type safety and validation
export const emailConfigSchema = z.object({
	host: validateString("Host", { min: 1 }),
	port: validateNumber("Port", { min: 1 }).max(65535, {
		message: "Port must be between 1 and 65535"
	}),
	secure: validateBoolean("Secure"), // true for 465, false for other ports
	auth: z.object({
		user: validateEmail,
		pass: validateString("Password", { min: 1 })
	}),
	// Optional settings
	service: validateString("Service").optional(), // 'gmail', 'outlook', etc.
	tls: z
		.object({
			rejectUnauthorized: validateBoolean("Reject Unauthorized").optional()
		})
		.optional()
});

export type EmailConfigSchemaType = z.infer<typeof emailConfigSchema>;

// Enhanced email message schema with template support
export const emailMessageSchema = z
	.object({
		to: validateEmailOrArray("To"),
		subject: validateString("Subject", { min: 1 }),
		text: validateString("Text").optional(),
		html: validateString("HTML").optional(),
		// Template options for dynamic content
		templateHtml: validateString("Template HTML").optional(), // HTML template from server
		templateData: templateDataSchema.optional(), // Data for template rendering
		name: validateString("Name").optional(),
		from: validateEmail.optional(),
		cc: validateEmailOrArray("CC").optional(),
		bcc: validateEmailOrArray("BCC").optional(),
		attachments: validateArray(
			"Attachments",
			z.object({
				filename: validateString("Filename", { min: 1 }),
				path: validateString("Path").optional(),
				content: validateUnion("Content", [
					validateString("Content"),
					z.instanceof(Buffer)
				]).optional(),
				contentType: validateString("Content Type").optional()
			})
		).optional()
	})
	.refine(data => data.text || data.html || data.templateHtml, {
		message: "Either text, html, or templateHtml must be provided",
		path: ["html"]
	});

export type EmailMessageSchemaType = z.infer<typeof emailMessageSchema>;
export type TemplateDataType = z.infer<typeof templateDataSchema>;
