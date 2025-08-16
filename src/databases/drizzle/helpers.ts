import { text, timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
};

export const meta = {
	metaTitle: text("meta_title").notNull().default("SEO Title"),
	metaDescription: text("meta_description").notNull().default("SEO Description"),
	metaKeywords: text("meta_keywords").notNull().default("SEO Keywords")
};
