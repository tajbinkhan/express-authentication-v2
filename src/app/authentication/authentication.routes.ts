import express, { Router } from "express";
import passport from "passport";

import AuthenticationController from "@/app/authentication/authentication.controller";

import { authenticationMiddleware } from "@/middlewares/authentication.middleware";
import { asyncErrorHandler } from "@/settings/errorHandler";

export const authenticationRouter: Router = (() => {
	const router = express.Router();

	// Get user information
	router.get(
		"/me",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).getSession();
		})
	);

	// Account verification route
	router.get("/account-verification", authenticationMiddleware, (req, res) => {
		new AuthenticationController(req, res).checkAccountVerification();
	});

	// Register route
	router.post("/register", (req, res) => {
		new AuthenticationController(req, res).register();
	});

	// Request OTP route
	router.post("/request-otp", (req, res) => {
		new AuthenticationController(req, res).requestOTPForUnverifiedUser();
	});

	// Verify login OTP route
	router.post(
		"/verify-otp",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).verifyOTP();
		})
	);

	// User login route
	router.post(
		"/login",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).login();
		})
	);

	// User google login route
	router.get("/login/google", (req, res, next) => {
		const { redirect } = req.query;
		const state = { redirect };
		// Base64 encode the state to pass it safely
		const encodedState = Buffer.from(JSON.stringify(state)).toString("base64");
		passport.authenticate("google", {
			scope: ["profile", "email"],
			state: encodedState,
			prompt: "select_account"
		})(req, res, next);
	});
	router.get(
		"/google/callback",
		passport.authenticate("google", { failureRedirect: "/login" }),
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).loginWithGoogle();
		})
	);

	// Password reset request route
	router.post(
		"/reset-password/request",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).resetPasswordOTPRequest();
		})
	);

	// Password reset confirmation route
	router.post(
		"/reset-password/confirm",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).resetPasswordConfirm();
		})
	);

	// Logout route
	router.post(
		"/logout",
		authenticationMiddleware,
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).logout();
		})
	);

	return router;
})();
