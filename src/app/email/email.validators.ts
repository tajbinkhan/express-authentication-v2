import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import { z } from "zod";

import { zodMessages } from "@/core/messages";
import type { SortingHelper } from "@/utils/sortingHelper";
import { BaseQuerySchema, baseQuerySchemaShape } from "@/validators/baseQuery.schema";
import { validateBoolean, validateString } from "@/validators/commonRules";

export const EmailQuerySchema = <T extends PgTableWithColumns<any>>(
	sortingHelper: SortingHelper<T>
) => {
	const baseSchema = BaseQuerySchema(sortingHelper);

	return z.preprocess(
		(data: any) => ({
			...baseSchema.parse(data)
		}),
		z.object({
			...baseQuerySchemaShape
		})
	);
};

export const EmailUpdateSchema = z.object({
	host: validateString("Host"),
	port: validateString("Port")
		.min(1, zodMessages.error.required.fieldIsRequired("Port"))
		.length(3, zodMessages.error.limit.length("Port", 3))
		.refine(value => {
			return !isNaN(Number(value));
		}, zodMessages.error.invalid.invalidNumber("Port")),
	secure: validateBoolean("Secure"),
	username: validateString("Username"),
	password: validateString("Password"),
	fromName: validateString("From Name"),
	fromEmail: validateString("From Email")
});

export type EmailQuerySchemaType = z.infer<ReturnType<typeof EmailQuerySchema>>;
export type EmailUpdateSchemaType = z.infer<typeof EmailUpdateSchema>;
