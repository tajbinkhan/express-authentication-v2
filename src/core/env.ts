import pc from "picocolors";
import { z } from "zod";

import { validateBoolean, validateEnum, validateString } from "@/validators/commonRules";

const emailEnvSchema = z.object({
	EMAIL_SERVER_HOST: validateString("EMAIL_SERVER_HOST"),
	EMAIL_SERVER_PORT: validateString("EMAIL_SERVER_PORT"),
	EMAIL_SERVER_USER: validateString("EMAIL_SERVER_USER"),
	EMAIL_SERVER_PASSWORD: validateString("EMAIL_SERVER_PASSWORD"),
	EMAIL_FROM: validateString("EMAIL_FROM")
});

export const googleEnvSchema = z.object({
	GOOGLE_CLIENT_ID: validateString("GOOGLE_CLIENT_ID"),
	GOOGLE_CLIENT_SECRET: validateString("GOOGLE_CLIENT_SECRET"),
	GOOGLE_CALLBACK_URL: validateString("GOOGLE_CALLBACK_URL")
});

export const envSchema = z.object({
	DATABASE_URL: validateString("DATABASE_URL"),
	PORT: validateString("PORT").refine(value => !isNaN(Number(value)), "PORT must be a number"),
	SECRET: validateString("SECRET"),
	NODE_ENV: validateEnum("NODE_ENV", ["development", "production"]),
	SESSION_COOKIE_NAME: validateString("SESSION_COOKIE_NAME"),
	ORIGIN_URL: validateString("ORIGIN_URL"),
	COOKIE_SETTINGS: validateEnum("COOKIE_SETTINGS", ["locally", "globally"]),
	COOKIE_DOMAIN: validateString("COOKIE_DOMAIN"),
	COOKIE_SAME_SITE: validateEnum("COOKIE_SAME_SITE", ["lax", "strict", "none"]),
	OTP_RESET_EXPIRY: validateString("OTP_RESET_EXPIRY").refine(
		value => !isNaN(Number(value)),
		"OTP_RESET_EXPIRY must be a number"
	),
	SHOW_OTP: validateString("SHOW_OTP").refine(value =>
		validateBoolean(value) ? true : "SHOW_OTP must be a boolean value (true or false)"
	),
	API_URL: validateString("API_URL"),
	...emailEnvSchema.shape,
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
