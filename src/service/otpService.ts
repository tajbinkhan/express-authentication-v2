import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { StatusCodes } from "http-status-codes";

import DrizzleService from "@/databases/drizzle/service";
import type { TokenType, UserSchemaType } from "@/databases/drizzle/types";
import { verificationToken } from "@/models/drizzle/authentication.model";
import AppHelpers from "@/utils/appHelpers";
import { ServiceResponse } from "@/utils/serviceApi";

export default class OTPService extends DrizzleService {
	private async limitOTPRequest(
		user: Partial<UserSchemaType>,
		tokenType: TokenType,
		timeLimit: number
	) {
		try {
			const otpRequestCount = await this.getDb().query.verificationToken.findFirst({
				where: and(
					eq(verificationToken.identifier, user.email!),
					eq(verificationToken.tokenType, tokenType)
				)
			});

			const currentMinute = new Date().getTime();
			const otpRequestUpdateTime = new Date(otpRequestCount?.updatedAt!).getTime();
			const timeDifference = currentMinute - otpRequestUpdateTime;
			// Convert it to human readable time
			const timeDifferenceInMinutes = Math.floor(timeDifference / 60000);

			if (otpRequestCount && timeDifferenceInMinutes < timeLimit) {
				const message = `You can only request OTP per ${timeLimit} minute(s). Please wait for ${timeLimit - timeDifferenceInMinutes} minute(s)`;
				return ServiceResponse.createRejectResponse(StatusCodes.TOO_MANY_REQUESTS, message);
			}

			return Promise.resolve(true);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	async saveOTPToDatabase(
		user: Partial<UserSchemaType>,
		tokenType: TokenType,
		timeLimit: number = Number(process.env.OTP_RESET_EXPIRY)
	) {
		try {
			if (!user.email)
				return ServiceResponse.createRejectResponse(
					StatusCodes.NOT_FOUND,
					"Email is not registered"
				);

			const now = new Date();
			const expiresAt = new Date(now.getTime() + timeLimit * 60000);

			await this.limitOTPRequest(user, tokenType, timeLimit);

			const generatedOTP = AppHelpers.OTPGenerator(6);
			const hashedOTP = bcrypt.hashSync(String(generatedOTP), 10);
			await this.getDb()
				.insert(verificationToken)
				.values({
					identifier: user.email,
					token: hashedOTP,
					tokenType,
					expires: expiresAt
				})
				.onConflictDoUpdate({
					target: [verificationToken.identifier, verificationToken.tokenType],
					set: {
						token: hashedOTP,
						expires: expiresAt
					}
				});

			return Promise.resolve(generatedOTP);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	async verifyOTPFromDatabase(user: Partial<UserSchemaType>, otp: string, tokenType: TokenType) {
		try {
			const tokenRecord = await this.getDb().query.verificationToken.findFirst({
				where: and(
					eq(verificationToken.identifier, user.email!),
					eq(verificationToken.tokenType, tokenType)
				)
			});

			if (tokenRecord && tokenRecord.token) {
				const isValid = bcrypt.compareSync(otp, tokenRecord.token);
				if (!isValid)
					return ServiceResponse.createRejectResponse(StatusCodes.BAD_REQUEST, "Invalid OTP");
			}

			if (!tokenRecord)
				return ServiceResponse.createRejectResponse(StatusCodes.BAD_REQUEST, "Invalid OTP");

			if (tokenRecord?.expires && tokenRecord.expires < new Date()) {
				await this.deleteOTPFromDatabase(user, tokenType);
				return ServiceResponse.createRejectResponse(StatusCodes.REQUEST_TIMEOUT, "OTP expired");
			}

			return Promise.resolve(true);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	async deleteOTPFromDatabase(user: Partial<UserSchemaType>, tokenType: TokenType) {
		try {
			await this.getDb()
				.delete(verificationToken)
				.where(
					and(
						eq(verificationToken.identifier, user.email!),
						eq(verificationToken.tokenType, tokenType)
					)
				);

			return Promise.resolve(true);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}
}
