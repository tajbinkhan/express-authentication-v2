import { z } from "zod";

import {
	validateEmail,
	validateNewPassword,
	validatePassword,
	validatePositiveNumber,
	validateString,
	validateUsername,
	validateUsernameOrEmail
} from "@/validators/commonRules";

export const userIdentityVerificationSchema = z.object({
	usernameOrEmail: validateUsernameOrEmail,
	password: validateString("Password")
});

export const userLoginSchema = z.object({
	usernameOrEmail: validateUsernameOrEmail,
	password: validateString("Password"),
	otp: validatePositiveNumber("OTP")
});

export const userRegisterSchema = z.object({
	username: validateUsername,
	email: validateEmail,
	password: validateNewPassword,
	name: validateString("Name")
});

export const userOTPRequestSchema = z.object({
	email: validateEmail
});

export const userOTPVerifySchema = z.object({
	email: validateEmail,
	otp: validatePositiveNumber("OTP")
});

export const userPasswordResetSchema = z.object({
	email: validateEmail,
	otp: validatePositiveNumber("OTP"),
	password: validatePassword
});

export const userChangePasswordSchema = z.object({
	oldPassword: validatePassword,
	newPassword: validateNewPassword
});

export const userUpdateCurrentOrganizationSchema = z.object({
	organizationId: validatePositiveNumber("Organization ID").or(
		z.null({
			error: issue =>
				issue.input !== null ? "Organization ID must be a positive number or null" : undefined
		})
	)
});
