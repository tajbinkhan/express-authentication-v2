import { and, count, eq, gte, ilike, lte, or } from "drizzle-orm";
import { StatusCodes } from "http-status-codes";
import nodemailer from "nodemailer";

import type { EmailQuerySchemaType, EmailUpdateSchemaType } from "@/app/email/email.validators";

import PaginationManager from "@/core/pagination";
import DrizzleService from "@/databases/drizzle/service";
import type { EmailSchemaType } from "@/databases/drizzle/types";
import { email } from "@/models/drizzle/email.model";
import { type ServiceApiResponse, ServiceResponse } from "@/utils/serviceApi";
import { SortingHelper } from "@/utils/sortingHelper";

export default class EmailService extends DrizzleService {
	private readonly sortingHelper: SortingHelper<typeof email>;

	constructor() {
		super();
		this.sortingHelper = new SortingHelper(email);
	}

	async retrieve(filter: EmailQuerySchemaType): Promise<ServiceApiResponse<EmailSchemaType[]>> {
		try {
			const orderBy = this.sortingHelper.applySorting(filter.sortingMethod, filter.sortBy);

			if (!filter.page || !filter.limit) {
				return await this.retrieveAll(filter.sortingMethod, filter.sortBy);
			}

			// Create date objects from string inputs if they exist
			const fromDate = filter.from ? new Date(filter.from) : undefined;
			const toDate = filter.to ? new Date(filter.to) : undefined;

			// If toDate exists, set it to the end of the day
			if (toDate) {
				toDate.setHours(23, 59, 59, 999);
			}

			const conditions = [
				filter.search
					? or(
							ilike(email.username, `%${filter.search}%`),
							ilike(email.emailConfigName, `%${filter.search}%`),
							ilike(email.fromName, `%${filter.search}%`),
							ilike(email.fromEmail, `%${filter.search}%`),
							ilike(email.host, `%${filter.search}%`)
						)
					: undefined,
				fromDate ? gte(email.createdAt, fromDate) : undefined,
				toDate ? lte(email.createdAt, toDate) : undefined
			].filter(Boolean);

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			const totalItems = await this.db
				.select({
					count: count()
				})
				.from(email)
				.where(whereClause)
				.then(result => result[0].count);

			const { pagination, offset } = new PaginationManager(
				filter.page,
				filter.limit,
				totalItems
			).createPagination();

			const data = await this.db.query.email.findMany({
				where: whereClause,
				limit: filter.limit ? filter.limit : undefined,
				offset: filter.limit ? offset : undefined,
				orderBy
			});

			return ServiceResponse.createResponse(
				StatusCodes.OK,
				"Email retrieved successfully",
				data,
				pagination
			);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	private async retrieveAll(
		sortingMethod?: string,
		sortBy?: string
	): Promise<ServiceApiResponse<EmailSchemaType[]>> {
		try {
			const orderBy = this.sortingHelper.applySorting(sortingMethod, sortBy);

			const data = await this.db.query.email.findMany({
				orderBy
			});

			return ServiceResponse.createResponse(StatusCodes.OK, "Email retrieved successfully", data);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	async retrieveOne(id: number): Promise<ServiceApiResponse<EmailSchemaType>> {
		try {
			const data = await this.db.query.email.findFirst({
				where: eq(email.id, id)
			});

			if (!data) {
				return ServiceResponse.createRejectResponse(StatusCodes.NOT_FOUND, "Email not found");
			}

			return ServiceResponse.createResponse(StatusCodes.OK, "Email retrieved successfully", data);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	async retrieveOneByConfigName(
		configName: string
	): Promise<ServiceApiResponse<EmailSchemaType | null>> {
		try {
			const data = await this.db.query.email.findFirst({
				where: eq(email.emailConfigName, configName)
			});

			if (!data) {
				return ServiceResponse.createResponse(StatusCodes.NOT_FOUND, "Email not found", null);
			}

			return ServiceResponse.createResponse(StatusCodes.OK, "Email retrieved successfully", data);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	async update(
		id: number,
		data: Partial<Omit<EmailSchemaType, "id" | "emailConfigName" | "createdAt" | "updatedAt">>
	): Promise<ServiceApiResponse<EmailSchemaType>> {
		try {
			const updatedData = await this.db
				.update(email)
				.set(data)
				.where(eq(email.id, id))
				.returning()
				.then(rows => rows[0]);

			if (!updatedData) {
				return ServiceResponse.createRejectResponse(StatusCodes.NOT_FOUND, "Email not found");
			}

			return ServiceResponse.createResponse(
				StatusCodes.OK,
				"Email updated successfully",
				updatedData
			);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	async validateSmtpConnection(
		smtpConfig: EmailUpdateSchemaType
	): Promise<ServiceApiResponse<boolean>> {
		try {
			const port = Number(smtpConfig.port);

			// Determine secure and requireTLS settings based on port and user preference
			let secure = smtpConfig.secure;
			let requireTLS = false;

			// Auto-configure based on common port conventions if secure is not explicitly set
			if (port === 465) {
				// Port 465 is typically SSL/TLS
				secure = true;
			} else if (port === 587 || port === 25) {
				// Port 587 is typically STARTTLS, port 25 can be either
				secure = false;
				requireTLS = true;
			}

			// Create nodemailer transporter with the provided configuration
			const transporter = nodemailer.createTransport({
				host: smtpConfig.host,
				port: port,
				secure: secure, // true for 465, false for other ports
				requireTLS: requireTLS, // true for STARTTLS
				auth: {
					user: smtpConfig.username,
					pass: smtpConfig.password
				},
				// Additional options to handle SSL/TLS issues
				tls: {
					// Do not fail on invalid certs (for self-signed certificates)
					rejectUnauthorized: false,
					// Minimum TLS version
					minVersion: "TLSv1",
					// Allow legacy server support
					ciphers: "SSLv3"
				},
				// Connection timeout
				connectionTimeout: 10000, // 10 seconds
				greetingTimeout: 10000, // 10 seconds
				socketTimeout: 10000 // 10 seconds
			});

			// Test the connection
			await transporter.verify();

			return ServiceResponse.createResponse(
				StatusCodes.OK,
				"SMTP connection validated successfully",
				true
			);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}
}
