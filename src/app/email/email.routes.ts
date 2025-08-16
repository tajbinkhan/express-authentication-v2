import express, { Router } from "express";

import EmailController from "@/app/email/email.controller";

import { authenticationMiddleware } from "@/middlewares/authentication.middleware";
import { asyncErrorHandler } from "@/settings/errorHandler";

export const emailRouter: Router = (() => {
	const router = express.Router();

	// Get all emails
	router.get(
		"",
		authenticationMiddleware,
		asyncErrorHandler(async (req, res) => {
			await new EmailController(req, res).index();
		})
	);

	// Test SMTP connection without saving
	router.route("/test-smtp").post(
		authenticationMiddleware,
		asyncErrorHandler(async (req, res) => {
			await new EmailController(req, res).testSmtpConnection();
		})
	);

	router
		.route("/:id")
		.get(
			authenticationMiddleware,
			asyncErrorHandler(async (req, res) => {
				await new EmailController(req, res).show();
			})
		)
		.put(
			authenticationMiddleware,
			asyncErrorHandler(async (req, res) => {
				await new EmailController(req, res).update();
			})
		);

	return router;
})();
