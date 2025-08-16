import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import { z } from "zod";

import type { SortingHelper } from "@/utils/sortingHelper";
import { BaseQuerySchema, baseQuerySchemaShape } from "@/validators/baseQuery.schema";
import { validateBoolean, validateNumber, validateString } from "@/validators/commonRules";

export const emailQuerySchema = <T extends PgTableWithColumns<any>>(
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

export const emailUpdateSchema = z.object({
	host: validateString("Host"),
	port: validateNumber("Port", { min: 1 }).max(65535, {
		message: "Port must be between 1 and 65535"
	}),
	secure: validateBoolean("Secure"),
	username: validateString("Username"),
	password: validateString("Password"),
	fromName: validateString("From Name"),
	fromEmail: validateString("From Email")
});

export type EmailQuerySchemaType = z.infer<ReturnType<typeof emailQuerySchema>>;
export type EmailUpdateSchemaType = z.infer<typeof emailUpdateSchema>;
