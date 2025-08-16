import { integer, json, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "@/databases/drizzle/helpers";

export const media = pgTable("media", {
	id: serial("id").primaryKey(),
	src: text("src").notNull().unique(),
	alt: text("alt").notNull(),
	size: integer("file_size").notNull(),
	mimeType: varchar("mime_type", { length: 100 }).notNull(),
	additionalData: json("additional_data"),
	...timestamps
});
