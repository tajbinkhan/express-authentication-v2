import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import AuthenticationService from "@/app/authentication/authentication.service";
import type { CreateUserType } from "@/app/authentication/authentication.type";
import {
	userIdentityVerificationSchema,
	userLoginSchema,
	userOTPRequestSchema,
	userOTPVerifySchema,
	userPasswordResetSchema,
	userRegisterSchema
} from "@/app/authentication/authentication.validators";
import EmailService from "@/app/email/email.service";
import EmailTemplateService from "@/app/emailTemplate/emailTemplate.service";

import { ApiController } from "@/core/controller";
import { TOKEN_LIST } from "@/databases/drizzle/lists";
import type { EmailSMTPService } from "@/mailer/config";
import { createEmailService, sendEmailWithTemplate } from "@/mailer/service";
import OTPService from "@/service/otpService";

export default class AuthenticationController extends ApiController {
	protected readonly authenticationService: AuthenticationService;
	protected readonly otpService: OTPService;
	protected readonly emailTemplateService: EmailTemplateService;
	protected readonly emailSMTPService: EmailSMTPService;
	protected readonly emailService: EmailService;
	protected readonly smtpConfigName: string = "default_smtp";

	/**
	 * Construct the controller
	 *
	 * @param request
	 * @param response
	 */
	constructor(request: Request, response: Response) {
		super(request, response);
		this.authenticationService = new AuthenticationService();
		this.otpService = new OTPService();
		this.emailTemplateService = new EmailTemplateService();
		this.emailSMTPService = createEmailService();
		this.emailService = new EmailService();
	}

	// Get User Session
	async getSession(): Promise<Response> {
		const { user } = this.request;
		if (!user) return this.apiResponse.successResponse("No session found");

		return this.apiResponse.successResponse("Authorized", user);
	}

	// Register User
	async register(): Promise<Response> {
		const { body } = this.request;
		const check = userRegisterSchema.safeParse(body);
		if (!check.success) {
			return this.apiResponse.badResponse(check.error.issues.map(err => err.message).join(" "));
		}

		await this.authenticationService.duplicateUserCheckByUsername(check.data.username);
		await this.authenticationService.duplicateUserCheckByEmail(check.data.email);

		const createdUserData: CreateUserType = {
			name: check.data.name,
			username: check.data.username,
			email: check.data.email,
			password: check.data.password,
			emailVerified: null,
			role: "MEMBER",
			image: null
		};

		const user = await this.authenticationService.createUser(createdUserData);

		// Generate OTP for email verification
		const otp = await this.otpService.saveOTPToDatabase(user.data, TOKEN_LIST.EMAIL_VERIFICATION);

		if (otp && user.data.email) {
			try {
				await sendEmailWithTemplate({
					emailTemplateService: this.emailTemplateService,
					emailService: this.emailService,
					templateName: "email_verification",
					emailConfigName: this.smtpConfigName,
					to: user.data.email,
					templateData: {
						username: user.data.username,
						otp,
						otpExpirationTime: Number(process.env.OTP_RESET_EXPIRY)
					}
				});
			} catch (error) {
				console.error("Failed to send verification email:", error);
				// Note: We don't fail the registration if email sending fails
			}
		}

		if (process.env.SHOW_OTP) {
			console.log(`OTP for user ${user.data.username}: ${otp}`);
			return this.apiResponse.successResponse("User registered successfully", {
				otp,
				otpExpirationTime: Number(process.env.OTP_RESET_EXPIRY)
			});
		}

		return this.apiResponse.successResponse("User registered successfully", {
			otpExpirationTime: Number(process.env.OTP_RESET_EXPIRY)
		});
	}

	// Re-request OTP for email verification
	async reRequestOTP(): Promise<Response> {
		const { body } = this.request;
		const check = userOTPRequestSchema.safeParse(body);
		if (!check.success) {
			return this.apiResponse.badResponse(check.error.issues.map(err => err.message).join(" "));
		}

		// Check if user is already verified or not
		const user = await this.authenticationService.findUserByEmail(check.data.email);
		if (user.data.emailVerified) {
			return this.apiResponse.badResponse("User is already verified");
		}

		const otp = await this.otpService.saveOTPToDatabase(user.data, TOKEN_LIST.EMAIL_VERIFICATION);
		const template = await this.emailTemplateService.retrieveEmailTemplate("email_verification");

		if (otp && user.data.email && template.data) {
			// sendEmail({
			// 	email: user.email,
			// 	template: template.data,
			// 	data: {
			// 		username: user.username,
			// 		otp,
			// 		otpExpirationTime: 5
			// 	}
			// });
		}

		if (process.env.SHOW_OTP) {
			console.log(`OTP for user ${user.data.username}: ${otp}`);
			return this.apiResponse.successResponse("OTP sent to your email", {
				otp,
				otpExpirationTime: Number(process.env.OTP_RESET_EXPIRY)
			});
		}

		return this.apiResponse.successResponse("OTP sent to your email", {
			otpExpirationTime: Number(process.env.OTP_RESET_EXPIRY)
		});
	}

	// Verify Registered User
	async verifyUser(): Promise<Response> {
		const { body } = this.request;
		const check = userOTPVerifySchema.safeParse(body);
		if (!check.success) {
			return this.apiResponse.badResponse(check.error.issues.map(err => err.message).join(" "));
		}

		const user = await this.authenticationService.findUserByEmail(check.data.email);

		await this.otpService.verifyOTPFromDatabase(
			user.data,
			String(check.data.otp),
			TOKEN_LIST.EMAIL_VERIFICATION
		);
		await this.otpService.deleteOTPFromDatabase(user.data, TOKEN_LIST.EMAIL_VERIFICATION);

		await this.authenticationService.accountVerification(user.data.id);

		return this.apiResponse.successResponse("User verified successfully");
	}

	// Verify User Identity
	async verifyIdentity(): Promise<Response> {
		const { body } = this.request;
		const check = userIdentityVerificationSchema.safeParse(body);
		if (!check.success) {
			return this.apiResponse.badResponse(check.error.issues.map(err => err.message).join(" "));
		}

		const user = await this.authenticationService.findUserByUsernameOrEmail(
			check.data.usernameOrEmail
		);

		await this.authenticationService.passwordChecker(check.data.password, user.data.password);

		// Check user verification
		if (!user.data.emailVerified) {
			return this.apiResponse.badResponse("User is not verified. Please verify your email.");
		}

		// Generate OTP for login verification
		const otp = await this.otpService.saveOTPToDatabase(user.data, TOKEN_LIST.LOGIN_OTP);

		if (otp && user.data.email) {
			try {
				sendEmailWithTemplate({
					emailTemplateService: this.emailTemplateService,
					emailService: this.emailService,
					templateName: "login_otp",
					emailConfigName: this.smtpConfigName,
					to: user.data.email,
					templateData: {
						username: user.data.username,
						otp,
						otpExpirationTime: Number(process.env.OTP_RESET_EXPIRY)
					}
				});
			} catch (error) {
				console.error("Failed to send verification email:", error);
				// Note: We don't fail the registration if email sending fails
			}
		}

		if (process.env.SHOW_OTP) {
			console.log(`OTP for user ${user.data.username}: ${otp}`);
			return this.apiResponse.successResponse("Identity verified. OTP sent your email", {
				otp,
				otpExpirationTime: Number(process.env.OTP_RESET_EXPIRY)
			});
		}

		return this.apiResponse.successResponse("Identity verified. OTP sent your email", {
			otpExpirationTime: Number(process.env.OTP_RESET_EXPIRY)
		});
	}

	// Login User
	async login(): Promise<Response | void> {
		const { body } = this.request;
		const check = userLoginSchema.safeParse(body);
		if (!check.success) {
			return this.apiResponse.badResponse(check.error.issues.map(err => err.message).join(" "));
		}

		const user = await this.authenticationService.findUserByUsernameOrEmail(
			check.data.usernameOrEmail
		);

		// Check user verification
		if (!user.data.emailVerified) {
			return this.apiResponse.badResponse("User is not verified. Please verify your email.");
		}

		await this.authenticationService.passwordChecker(check.data.password, user.data.password);

		await this.otpService.verifyOTPFromDatabase(
			user.data,
			String(check.data.otp),
			TOKEN_LIST.LOGIN_OTP
		);
		await this.otpService.deleteOTPFromDatabase(user.data, TOKEN_LIST.LOGIN_OTP);

		const { password, ...userData } = user.data;

		// Log the user in to establish session
		this.request.login(userData, err => {
			if (err) {
				return this.apiResponse.sendResponse({
					status: StatusCodes.INTERNAL_SERVER_ERROR,
					message: "Login failed"
				});
			}

			return this.apiResponse.successResponse("Login successful", userData);
		});
	}

	// Google Login
	async loginWithGoogle(): Promise<Response | void> {
		let redirectUrl = null;

		// Decode state parameter with error handling
		const encodedState = this.request.query.state as string;
		if (encodedState) {
			try {
				const decodedState = JSON.parse(Buffer.from(encodedState, "base64").toString());
				redirectUrl = decodedState.redirect;

				// Decode the URL if it's URL-encoded
				if (redirectUrl && typeof redirectUrl === "string") {
					redirectUrl = decodeURIComponent(redirectUrl);
				}
			} catch (error) {
				console.error("Error decoding state:", error);
			}
		}

		// If a redirect URL is provided, redirect to it
		if (redirectUrl) {
			return this.response.redirect(redirectUrl);
		}

		// Otherwise, send JSON response
		return this.apiResponse.successResponse("Google login successful", {
			user: this.request.user
		});
	}

	// Logout User
	async logout(): Promise<Response | void> {
		this.request.session.destroy(err => {
			if (err) {
				return this.apiResponse.sendResponse({
					status: StatusCodes.INTERNAL_SERVER_ERROR,
					message: "Error logging out"
				});
			}

			this.response.clearCookie(process.env.SESSION_COOKIE_NAME);
			return this.apiResponse.successResponse("Logged out");
		});
	}

	// Request Password Reset OTP
	async resetPasswordOTPRequest(): Promise<Response> {
		const { body } = this.request;
		const check = userOTPRequestSchema.safeParse(body);
		if (!check.success)
			return this.apiResponse.badResponse(check.error.issues.map(err => err.message).join(" "));

		const user = await this.authenticationService.findUserByEmail(body.email);

		const otp = await this.otpService.saveOTPToDatabase(user.data, TOKEN_LIST.PASSWORD_RESET);
		const template = await this.emailTemplateService.retrieveEmailTemplate("password_reset");

		if (otp && user.data.email && template.data) {
			// sendEmail({
			// 	email: user.data.email,
			// 	template: template.data,
			// 	data: {
			// 		username: user.data.username,
			// 		otp,
			// 		otpExpirationTime: 5
			// 	}
			// });
		}

		if (process.env.SHOW_OTP) {
			console.log(`OTP for user ${user.data.username}: ${otp}`);
			return this.apiResponse.successResponse("OTP sent to your email", {
				otp,
				otpExpirationTime: Number(process.env.OTP_RESET_EXPIRY)
			});
		}

		return this.apiResponse.successResponse("Password reset OTP sent", {
			otpExpirationTime: Number(process.env.OTP_RESET_EXPIRY)
		});
	}

	// Verify Password Reset OTP
	async resetPasswordOTPVerify(): Promise<Response> {
		const { body } = this.request;
		const check = userOTPVerifySchema.safeParse(body);
		if (!check.success)
			return this.apiResponse.badResponse(check.error.issues.map(err => err.message).join(" "));

		const user = await this.authenticationService.findUserByEmail(check.data.email);

		await this.otpService.verifyOTPFromDatabase(
			user.data,
			String(check.data.otp),
			TOKEN_LIST.PASSWORD_RESET
		);

		return this.apiResponse.successResponse("OTP verified successfully");
	}

	// Complete Password Reset
	async resetPasswordConfirm(): Promise<Response> {
		const { body } = this.request;
		const check = userPasswordResetSchema.safeParse(body);
		if (!check.success)
			return this.apiResponse.badResponse(check.error.issues.map(err => err.message).join(", "));

		const user = await this.authenticationService.findUserByEmail(check.data.email);

		await this.otpService.verifyOTPFromDatabase(
			user.data,
			String(check.data.otp),
			TOKEN_LIST.PASSWORD_RESET
		);
		await this.otpService.deleteOTPFromDatabase(user.data, TOKEN_LIST.PASSWORD_RESET);
		await this.authenticationService.changePassword(user.data.id, check.data.password);

		return this.apiResponse.successResponse("User password reset");
	}
}
