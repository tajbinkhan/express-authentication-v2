import type { NextFunction, Request, Response } from "express";

import { asyncErrorHandler } from "@/settings/errorHandler";
import { ApiResponse } from "@/utils/serviceApi";

const sessionCookieName = process.env.SESSION_COOKIE_NAME;

const authenticationMiddlewareHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	const apiResponse = new ApiResponse(res);

	if (!req.isAuthenticated()) {
		res.clearCookie(sessionCookieName);
		apiResponse.unauthorizedResponse("Unauthorized: Not authenticated");
		return;
	}

	next();
};

export const authenticationMiddleware = asyncErrorHandler(authenticationMiddlewareHandler);
