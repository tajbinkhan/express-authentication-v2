import type { InferSelectModel } from "drizzle-orm";

import { ROLE_LIST, TOKEN_LIST } from "@/databases/drizzle/lists";
import type { accounts, users } from "@/models/drizzle/authentication.model";
import type { emailTemplates } from "@/models/drizzle/emailTemplate.model";
import type { media } from "@/models/drizzle/media.model";

export type UserSchemaType = InferSelectModel<typeof users>;
export type AccountSchemaType = InferSelectModel<typeof accounts>;
export type EmailTemplateSchemaType = InferSelectModel<typeof emailTemplates>;
export type MediaSchemaType = InferSelectModel<typeof media>;

/**
 * Enum Schema Types
 */
export type RoleType = (typeof ROLE_LIST.enumValues)[number];
export type TokenType = (typeof TOKEN_LIST.enumValues)[number];
