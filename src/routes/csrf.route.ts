import express, { Router } from "express";

import { asyncErrorHandler } from "@/settings/errorHandler";
import { generateCsrfToken } from "@/utils/csrf";
import { ApiResponse } from "@/utils/serviceApi";

export const csrfRouter: Router = (() => {
	const router = express.Router();
	router.get(
		"",
		asyncErrorHandler(async (req, res) => {
			const token = generateCsrfToken(req, res);
			new ApiResponse(res).successResponse("CSRF token generated", token);
		})
	);

	return router;
})();
