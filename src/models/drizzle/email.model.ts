import { boolean, pgTable, serial, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "@/databases/drizzle/helpers";

export const email = pgTable("email", {
	id: serial("id").primaryKey(),
	emailConfigName: varchar("email_config_name", { length: 255 }).notNull().unique(),
	host: varchar("host", { length: 255 }).notNull(),
	port: varchar("port", { length: 255 }).notNull(),
	username: varchar("username", { length: 255 }).notNull(),
	password: varchar("password", { length: 255 }).notNull(),
	secure: boolean("secure").notNull().default(false),
	fromName: varchar("from_name", { length: 255 }).notNull(),
	fromEmail: varchar("from_email", { length: 255 }).notNull(),
	...timestamps
});
