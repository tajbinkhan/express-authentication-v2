import express, { Router } from "express";
import multer from "multer";

import MediaController from "@/app/media/media.controller";

import { authenticationMiddleware } from "@/middlewares/authentication.middleware";
import { asyncErrorHandler } from "@/settings/errorHandler";

const upload = multer();

export const mediaRouter: Router = (() => {
	const router = express.Router();

	router
		.route("")
		.get(
			authenticationMiddleware,
			asyncErrorHandler(async (req, res) => {
				await new MediaController(req, res).index();
			})
		)
		.post(
			authenticationMiddleware,
			upload.any(),
			asyncErrorHandler(async (req, res) => {
				await new MediaController(req, res).upload();
			})
		);

	router
		.route("/:id")
		.put(
			authenticationMiddleware,
			asyncErrorHandler(async (req, res) => {
				await new MediaController(req, res).updateName();
			})
		)
		.delete(
			authenticationMiddleware,
			asyncErrorHandler(async (req, res) => {
				await new MediaController(req, res).delete();
			})
		);

	return router;
})();
