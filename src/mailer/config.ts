import Handlebars from "handlebars";
import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer";

import {
	type EmailConfigSchemaType,
	type EmailMessageSchemaType,
	type TemplateDataType,
	emailConfigSchema,
	emailMessageSchema
} from "@/mailer/schema";

// Email service class with Handlebars support
export class EmailSMTPService {
	private transporter: Transporter;
	private defaultFrom: string;
	private templateCache = new Map<string, Handlebars.TemplateDelegate>();
	private helpersRegistered = false;

	constructor(config: EmailConfigSchemaType) {
		// Validate configuration
		const validConfig = emailConfigSchema.parse(config);

		this.transporter = nodemailer.createTransport({
			host: validConfig.host,
			port: validConfig.port,
			secure: validConfig.secure,
			auth: validConfig.auth,
			...(validConfig.service && { service: validConfig.service }),
			...(validConfig.tls && { tls: validConfig.tls })
		});

		this.defaultFrom = validConfig.auth.user;

		// Initialize built-in helpers
		this.initializeHandlebars();
	}

	// Initialize Handlebars with built-in helpers
	private initializeHandlebars(): void {
		if (this.helpersRegistered) return;

		// Date formatting helper
		Handlebars.registerHelper("formatDate", (date: Date | string, format?: string) => {
			try {
				const d = new Date(date);
				if (isNaN(d.getTime())) return date;

				// Simple format options
				switch (format) {
					case "short":
						return d.toLocaleDateString();
					case "long":
						return d.toLocaleDateString("en-US", {
							year: "numeric",
							month: "long",
							day: "numeric"
						});
					case "time":
						return d.toLocaleTimeString();
					case "datetime":
						return d.toLocaleString();
					default:
						return d.toLocaleDateString();
				}
			} catch (error) {
				return date;
			}
		});

		// Currency formatting helper
		Handlebars.registerHelper("formatCurrency", (amount: number, currency: string = "USD") => {
			try {
				return new Intl.NumberFormat("en-US", {
					style: "currency",
					currency: currency
				}).format(amount);
			} catch (error) {
				return amount;
			}
		});

		// Number formatting helper
		Handlebars.registerHelper("formatNumber", (number: number, decimals?: number) => {
			try {
				return new Intl.NumberFormat("en-US", {
					minimumFractionDigits: decimals,
					maximumFractionDigits: decimals
				}).format(number);
			} catch (error) {
				return number;
			}
		});

		// Conditional helpers
		Handlebars.registerHelper("ifEquals", function (this: any, arg1: any, arg2: any, options: any) {
			return arg1 == arg2 ? options.fn(this) : options.inverse(this);
		});

		Handlebars.registerHelper(
			"ifNotEquals",
			function (this: any, arg1: any, arg2: any, options: any) {
				return arg1 != arg2 ? options.fn(this) : options.inverse(this);
			}
		);

		Handlebars.registerHelper(
			"ifGreater",
			function (this: any, arg1: number, arg2: number, options: any) {
				return arg1 > arg2 ? options.fn(this) : options.inverse(this);
			}
		);

		Handlebars.registerHelper(
			"ifLess",
			function (this: any, arg1: number, arg2: number, options: any) {
				return arg1 < arg2 ? options.fn(this) : options.inverse(this);
			}
		);

		// Array/Object helpers
		Handlebars.registerHelper("length", (array: any[]) => {
			return Array.isArray(array) ? array.length : 0;
		});

		Handlebars.registerHelper("isEmpty", (array: any[]) => {
			return !Array.isArray(array) || array.length === 0;
		});

		Handlebars.registerHelper("isNotEmpty", (array: any[]) => {
			return Array.isArray(array) && array.length > 0;
		});

		// Math helpers
		Handlebars.registerHelper("add", (a: number, b: number) => a + b);
		Handlebars.registerHelper("subtract", (a: number, b: number) => a - b);
		Handlebars.registerHelper("multiply", (a: number, b: number) => a * b);
		Handlebars.registerHelper("divide", (a: number, b: number) => (b !== 0 ? a / b : 0));
		Handlebars.registerHelper("modulo", (a: number, b: number) => (b !== 0 ? a % b : 0));

		// String helpers
		Handlebars.registerHelper("uppercase", (str: string) => str?.toUpperCase() || "");
		Handlebars.registerHelper("lowercase", (str: string) => str?.toLowerCase() || "");
		Handlebars.registerHelper("capitalize", (str: string) => {
			if (!str) return "";
			return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
		});

		Handlebars.registerHelper("truncate", (str: string, length: number) => {
			if (!str || str.length <= length) return str;
			return str.substring(0, length) + "...";
		});

		// Utility helpers
		Handlebars.registerHelper("json", (obj: any) => JSON.stringify(obj));
		Handlebars.registerHelper("currentYear", () => new Date().getFullYear());
		Handlebars.registerHelper("currentDate", () => new Date().toLocaleDateString());

		// Loop helpers
		Handlebars.registerHelper("times", function (this: any, n: number, options: any) {
			let result = "";
			for (let i = 0; i < n; i++) {
				result += options.fn({ index: i, number: i + 1 });
			}
			return result;
		});

		this.helpersRegistered = true;
	}

	// Compile and cache template
	private compileTemplate(templateHtml: string, cacheKey?: string): Handlebars.TemplateDelegate {
		// Check cache first if cacheKey provided
		if (cacheKey && this.templateCache.has(cacheKey)) {
			return this.templateCache.get(cacheKey)!;
		}

		try {
			const compiledTemplate = Handlebars.compile(templateHtml);

			// Cache if cacheKey provided
			if (cacheKey) {
				this.templateCache.set(cacheKey, compiledTemplate);
			}

			return compiledTemplate;
		} catch (error) {
			throw new Error(
				`Failed to compile template: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	// Render template with data
	private renderTemplate(
		templateHtml: string,
		data: TemplateDataType = {},
		cacheKey?: string
	): string {
		try {
			const template = this.compileTemplate(templateHtml, cacheKey);
			return template(data);
		} catch (error) {
			throw new Error(
				`Failed to render template: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	// Register custom helper
	registerHelper(name: string, helperFunction: Handlebars.HelperDelegate): void {
		Handlebars.registerHelper(name, helperFunction);
	}

	// Register multiple custom helpers
	registerHelpers(helpers: Record<string, Handlebars.HelperDelegate>): void {
		Object.entries(helpers).forEach(([name, helper]) => {
			this.registerHelper(name, helper);
		});
	}

	// Clear template cache
	clearTemplateCache(): void {
		this.templateCache.clear();
	}

	// Verify connection
	async verifyConnection(): Promise<boolean> {
		try {
			await this.transporter.verify();
			return true;
		} catch (error) {
			console.error("Email connection failed:", error);
			return false;
		}
	}

	// Send email with template support
	async sendEmail(
		message: EmailMessageSchemaType
	): Promise<{ success: boolean; messageId?: string; error?: string }> {
		try {
			// Validate message
			const validMessage = emailMessageSchema.parse(message);

			let htmlContent = validMessage.html;

			// Render template if templateHtml is provided
			if (validMessage.templateHtml) {
				const cacheKey = validMessage.templateData
					? `template_${Buffer.from(validMessage.templateHtml).toString("base64").substring(0, 32)}`
					: undefined;

				htmlContent = this.renderTemplate(
					validMessage.templateHtml,
					validMessage.templateData || {},
					cacheKey
				);
			}

			const from = validMessage.name
				? `${validMessage.name} <${validMessage.from || this.defaultFrom}>`
				: this.defaultFrom;

			const mailOptions: SendMailOptions = {
				from,
				to: validMessage.to,
				subject: validMessage.subject,
				text: validMessage.text,
				html: htmlContent,
				cc: validMessage.cc,
				bcc: validMessage.bcc,
				attachments: validMessage.attachments
			};

			const info = await this.transporter.sendMail(mailOptions);

			return {
				success: true,
				messageId: info.messageId
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
			console.error("Failed to send email:", errorMessage);

			return {
				success: false,
				error: errorMessage
			};
		}
	}

	// Bulk send emails
	async sendBulkEmails(
		messages: EmailMessageSchemaType[]
	): Promise<Array<{ success: boolean; messageId?: string; error?: string }>> {
		return Promise.all(messages.map(message => this.sendEmail(message)));
	}

	// Close transporter
	close(): void {
		this.transporter.close();
	}
}
