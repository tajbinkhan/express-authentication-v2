import type { Request, Response } from "express";

import EmailService from "@/app/email/email.service";
import { EmailQuerySchema, EmailUpdateSchema } from "@/app/email/email.validators";

import { ApiController } from "@/core/controller";
import { email } from "@/models/drizzle/email.model";
import { SortingHelper } from "@/utils/sortingHelper";

export default class EmailController extends ApiController {
	private readonly sortingHelper: SortingHelper<typeof email>;
	protected readonly emailService: EmailService;

	/**
	 * Construct the controller
	 *
	 * @param request
	 * @param response
	 */
	constructor(request: Request, response: Response) {
		super(request, response);
		this.sortingHelper = new SortingHelper(email);
		this.emailService = new EmailService();
	}

	async index(): Promise<Response> {
		const { query } = this.request;

		const check = EmailQuerySchema(this.sortingHelper).safeParse(query);
		if (!check.success) {
			return this.apiResponse.badResponse(check.error.issues.map(err => err.message).join(" "));
		}

		const data = await this.emailService.retrieve(check.data);

		return this.apiResponse.sendResponse(data);
	}

	async show(): Promise<Response> {
		const { id } = this.request.params;

		if (isNaN(Number(id))) return this.apiResponse.badResponse("Email ID must be a number");

		const data = await this.emailService.retrieveOne(Number(id));

		return this.apiResponse.sendResponse(data);
	}

	async update(): Promise<Response> {
		const { body } = this.request;
		const { id } = this.request.params;

		if (isNaN(Number(id))) return this.apiResponse.badResponse("Email ID must be a number");

		const check = EmailUpdateSchema.safeParse(body);
		if (!check.success) {
			return this.apiResponse.badResponse(check.error.issues.map(err => err.message).join(" "));
		}

		// Validate SMTP connection before saving to database
		await this.emailService.validateSmtpConnection(check.data);

		const data = await this.emailService.update(Number(id), check.data);

		return this.apiResponse.sendResponse(data);
	}

	async testSmtpConnection(): Promise<Response> {
		const { body } = this.request;

		const check = EmailUpdateSchema.safeParse(body);
		if (!check.success) {
			return this.apiResponse.badResponse(check.error.issues.map(err => err.message).join(" "));
		}

		const smtpValidation = await this.emailService.validateSmtpConnection(check.data);
		return this.apiResponse.sendResponse(smtpValidation);
	}
}
