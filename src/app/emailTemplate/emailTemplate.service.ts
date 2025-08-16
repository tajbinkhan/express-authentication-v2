import { eq } from "drizzle-orm";
import { StatusCodes } from "http-status-codes";

import DrizzleService from "@/databases/drizzle/service";
import type { EmailTemplateSchemaType } from "@/databases/drizzle/types";
import { emailTemplates } from "@/models/drizzle/emailTemplate.model";
import { type ServiceApiResponse, ServiceResponse } from "@/utils/serviceApi";

export default class EmailTemplateService extends DrizzleService {
	async retrieveEmailTemplate(
		name: string
	): Promise<ServiceApiResponse<EmailTemplateSchemaType | null>> {
		try {
			const template = await this.getDb().query.emailTemplates.findFirst({
				where: eq(emailTemplates.name, name)
			});

			if (!template) {
				return ServiceResponse.createResponse(
					StatusCodes.NOT_FOUND,
					"Email template not found",
					null
				);
			}

			return ServiceResponse.createResponse(
				StatusCodes.OK,
				"Email template retrieved successfully",
				template
			);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}
}
