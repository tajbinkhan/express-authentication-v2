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

	// Register user route
	router.post(
		"/register",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).register();
		})
	);

	// Request OTP for email verification
	router.post(
		"/register/otp",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).reRequestOTP();
		})
	);

	// Verify user registration
	router.post(
		"/register/verify",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).verifyUser();
		})
	);

	// Verify identity
	router.post(
		"/verify-identity",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).verifyIdentity();
		})
	);

	// User login route
	router.post(
		"/login",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).login();
		})
	);

	// Password reset request route
	router.post(
		"/reset-password/request",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).resetPasswordOTPRequest();
		})
	);

	// Password reset OTP verification route
	router.post(
		"/reset-password/verify",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).resetPasswordOTPVerify();
		})
	);

	// Password reset confirmation route
	router.post(
		"/reset-password/confirm",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).resetPasswordConfirm();
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
