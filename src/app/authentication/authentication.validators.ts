import { z } from "zod";

import { TOKEN_LIST } from "@/databases/drizzle/lists";
import {
	validateEmail,
	validateEnum,
	validateNewPassword,
	validatePassword,
	validatePositiveNumber,
	validateString,
	validateUsername,
	validateUsernameOrEmail
} from "@/validators/commonRules";

export const UserLoginSchema = z.object({
	usernameOrEmail: validateUsernameOrEmail,
	password: validateString("Password")
});

export const UserRegisterSchema = z.object({
	name: validateString("Name"),
	username: validateUsername,
	email: validateEmail,
	password: validatePassword
});

export const UserOTPRequestSchema = z.object({
	email: validateEmail
});

export const UserReverificationSchema = z.object({
	username: validateUsernameOrEmail
});

export const UserOTPVerifySchema = z.object({
	email: validateEmail,
	otp: validatePositiveNumber("OTP"),
	verificationMethod: validateEnum("Verification Method", TOKEN_LIST.enumValues)
});

export const UserPasswordResetSchema = z.object({
	email: validateEmail,
	otp: validatePositiveNumber("OTP"),
	password: validatePassword
});

export const UserChangePasswordSchema = z.object({
	oldPassword: validatePassword,
	newPassword: validateNewPassword
});
