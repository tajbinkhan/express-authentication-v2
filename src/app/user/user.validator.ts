import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import { z } from "zod";

import { ROLE_LIST } from "@/databases/drizzle/lists";
import { SortingHelper } from "@/utils/sortingHelper";
import { BaseQuerySchema, baseQuerySchemaShape } from "@/validators/baseQuery.schema";
import {
	validateBoolean,
	validateEmail,
	validateEnum,
	validatePassword,
	validatePositiveNumber,
	validateString,
	validateUsername
} from "@/validators/commonRules";

export const UserQuerySchema = <T extends PgTableWithColumns<any>>(
	sortingHelper: SortingHelper<T>
) => {
	const baseSchema = BaseQuerySchema(sortingHelper);

	return z.preprocess(
		(data: any) => ({
			...baseSchema.parse(data),
			roleQuery: data.roleQuery ? String(data.roleQuery).split(",") : undefined
		}),
		z.object({
			...baseQuerySchemaShape,
			roleQuery: z.array(validateString("Role Query")).optional()
		})
	);
};

export const UserCreateSchema = z.object({
	name: validateString("Name"),
	email: validateEmail,
	username: validateUsername,
	password: validatePassword,
	role: validateEnum("Role", ROLE_LIST.enumValues),
	emailVerified: validateBoolean("Email Verified")
});

export const UserDeleteSchema = z.object({
	ids: z.array(validatePositiveNumber("User ID"))
});
