import pc from "picocolors";
import { z } from "zod";

import {
	validateBoolean,
	validateEnum,
	validateEnvNumber,
	validateString
} from "@/validators/commonRules";

const smtpEnvSchema = z.object({
	SMTP_HOST: validateString("SMTP_HOST"),
	SMTP_PORT: validateEnvNumber("SMTP_PORT", { min: 1, max: 65535, int: true }),
	SMTP_SECURE: validateEnum("SMTP_SECURE", ["true", "false"]),
	SMTP_USER: validateString("SMTP_USER"),
	SMTP_PASSWORD: validateString("SMTP_PASSWORD")
});

export const googleEnvSchema = z.object({
	GOOGLE_CLIENT_ID: validateString("GOOGLE_CLIENT_ID"),
	GOOGLE_CLIENT_SECRET: validateString("GOOGLE_CLIENT_SECRET"),
	GOOGLE_CALLBACK_URL: validateString("GOOGLE_CALLBACK_URL")
});

export const cookieSchema = z.object({
	COOKIE_SETTINGS: validateEnum("COOKIE_SETTINGS", ["locally", "globally"]),
	COOKIE_DOMAIN: validateString("COOKIE_DOMAIN"),
	COOKIE_SAME_SITE: validateEnum("COOKIE_SAME_SITE", ["lax", "strict", "none"])
});

export const envSchema = z.object({
	DATABASE_URL: validateString("DATABASE_URL"),
	PORT: validateEnvNumber("PORT", { min: 1, int: true }),
	SECRET: validateString("SECRET"),
	NODE_ENV: validateEnum("NODE_ENV", ["development", "production"]),
	SESSION_COOKIE_NAME: validateString("SESSION_COOKIE_NAME"),
	ORIGIN_URL: validateString("ORIGIN_URL"),
	OTP_RESET_EXPIRY: validateEnvNumber("OTP_RESET_EXPIRY", { min: 1, int: true }),
	SHOW_OTP: validateString("SHOW_OTP").refine(value =>
		validateBoolean(value) ? true : "SHOW_OTP must be a boolean value (true or false)"
	),
	API_URL: validateString("API_URL"),
	...cookieSchema.shape,
	...smtpEnvSchema.shape,
	...googleEnvSchema.shape
});

const Env = envSchema.safeParse(process.env);

if (!Env.success) {
	const errorMessages = Env.error.issues.map(e => e.message).join("\n");
	console.error(pc.red(`Environment validation failed:\n${errorMessages}`));
	process.exit(1);
}

export type EnvType = z.infer<typeof envSchema>;

declare global {
	namespace NodeJS {
		interface ProcessEnv extends EnvType {}
	}
}
