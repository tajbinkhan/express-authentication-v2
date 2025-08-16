import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import AuthenticationService from "@/app/authentication/authentication.service";
import {
	UserLoginSchema,
	UserOTPRequestSchema,
	UserOTPVerifySchema,
	UserPasswordResetSchema,
	UserRegisterSchema,
	UserReverificationSchema
} from "@/app/authentication/authentication.validators";
import EmailTemplateService from "@/app/emailTemplate/emailTemplate.service";

import { ApiController } from "@/core/controller";
import { TOKEN_LIST } from "@/databases/drizzle/lists";
import type { UserSchemaType } from "@/databases/drizzle/types";
import sendEmail from "@/service/emailService";
import OTPService from "@/service/otpService";

export default class AuthenticationController extends ApiController {
	protected readonly authenticationService: AuthenticationService;
	protected readonly otpService: OTPService;
	protected readonly emailTemplateService: EmailTemplateService;

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
	}

	// Get User Session
	async getSession(): Promise<Response> {
		const { user } = this.request;
		if (!user) return this.apiResponse.successResponse("No session found");

		return this.apiResponse.successResponse("Authorized", user);
	}

	// Verify OTP
	async verifyOTP(): Promise<Response> {
		const { body } = this.request;
		const check = UserOTPVerifySchema.safeParse(body);
		if (!check.success) {
			return this.apiResponse.badResponse(check.error.issues.map(err => err.message).join(" "));
		}

		const user = await this.authenticationService.findUserByEmail(check.data.email);

		await this.otpService.verifyOTPFromDatabase(
			user.data,
			String(check.data.otp),
			check.data.verificationMethod
		);

		return this.apiResponse.successResponse("OTP verified successfully");
	}

	// Check Account Verification
	async checkAccountVerification(): Promise<Response> {
		const { user } = this.request;

		if (!user?.emailVerified) {
			this.request.session.destroy(err => {
				if (err) {
					return this.apiResponse.sendResponse({
						status: StatusCodes.INTERNAL_SERVER_ERROR,
						message: "Error logging out"
					});
				}
				return this.apiResponse.unauthorizedResponse("Unauthorized: Account is not verified");
			});
			return this.apiResponse.unauthorizedResponse("Unauthorized: Account is not verified");
		}

		return this.apiResponse.successResponse("User is verified");
	}

	// Register User
	async register(): Promise<Response> {
		const { body } = this.request;
		const check = UserRegisterSchema.safeParse(body);
		if (!check.success)
			return this.apiResponse.badResponse(check.error.issues.map(err => err.message).join(", "));

		const extendedData: Omit<UserSchemaType, "id" | "createdAt" | "updatedAt"> = {
			...check.data,
			image: null,
			emailVerified: null,
			password: bcrypt.hashSync(check.data.password, 10),
			role: "MEMBER"
		};

		const template = await this.emailTemplateService.retrieveEmailTemplate(
			"account_verification_otp"
		);

		const user = await this.authenticationService.createUser(extendedData);

		const otp = await this.otpService.saveOTPToDatabase(user.data, TOKEN_LIST.EMAIL_VERIFICATION);

		if (otp && user.data.email) {
			sendEmail({
				email: user.data.email,
				template: template.data,
				data: {
					username: user.data.username,
					otp,
					otpExpirationTime: 5
				}
			});
		}

		return this.apiResponse.sendResponse(user);
	}

	// Request OTP for unverified user
	async requestOTPForUnverifiedUser() {
		const { body } = this.request;
		const check = UserReverificationSchema.safeParse(body);
		if (!check.success)
			return this.apiResponse.badResponse(check.error.issues.map(err => err.message).join(", "));

		const user = await this.authenticationService.findUserByUsernameOrEmail(check.data.username);

		if (user.data.emailVerified) return this.apiResponse.badResponse("User is already verified");

		const template = await this.emailTemplateService.retrieveEmailTemplate(
			"account_verification_otp"
		);

		const otp = await this.otpService.saveOTPToDatabase(user.data, TOKEN_LIST.EMAIL_VERIFICATION);

		if (otp && user.data.email) {
			sendEmail({
				email: user.data.email,
				template: template.data,
				data: {
					username: user.data.username,
					otp,
					otpExpirationTime: 5
				}
			});
		}

		return this.apiResponse.successResponse("OTP sent");
	}

	// Login User
	async login(): Promise<Response | void> {
		const { body } = this.request;
		const check = UserLoginSchema.safeParse(body);
		if (!check.success) {
			return this.apiResponse.badResponse(check.error.issues.map(err => err.message).join(" "));
		}

		const user = await this.authenticationService.findUserByUsernameOrEmail(
			check.data.usernameOrEmail
		);
		await this.authenticationService.checkAccountVerification(user.data.id);
		await this.authenticationService.passwordChecker(check.data.password, user.data.password);

		const { password, ...userData } = user.data;

		// Log the user in to establish session
		this.request.login(user.data, err => {
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
		const check = UserOTPRequestSchema.safeParse(body);
		if (!check.success)
			return this.apiResponse.badResponse(check.error.issues.map(err => err.message).join(" "));

		const user = await this.authenticationService.findUserByEmail(body.email);

		const otp = await this.otpService.saveOTPToDatabase(user.data, TOKEN_LIST.PASSWORD_RESET);

		if (otp && user.data.email) {
			const template = await this.emailTemplateService.retrieveEmailTemplate("password_reset");

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

	// Complete Password Reset
	async resetPasswordConfirm(): Promise<Response> {
		const { body } = this.request;
		const check = UserPasswordResetSchema.safeParse(body);
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
