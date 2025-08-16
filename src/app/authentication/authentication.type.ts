import type { UserSchemaType } from "@/databases/drizzle/types";

export type CreateUserType = Omit<UserSchemaType, "id" | "createdAt" | "updatedAt">;
