import type { Express, NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import pc from "picocolors";
import { ZodError } from "zod";

import { ApiResponse } from "@/utils/serviceApi";

/**
 * Global error handler middleware for Express application
 * This middleware catches all errors and prevents the application from crashing
 */
export function globalErrorHandler(
	error: Error | ZodError | any,
	req: Request,
	res: Response,
	next: NextFunction
): void {
	const apiResponse = new ApiResponse(res);

	// Log the error for debugging
	logError(error, req);

	// Handle different types of errors
	if (error instanceof ZodError) {
		handleZodError(error, apiResponse);
		return;
	}

	if (error.name === "ValidationError") {
		handleValidationError(error, apiResponse);
		return;
	}

	if (error.name === "CastError") {
		handleCastError(error, apiResponse);
		return;
	}

	if (error.name === "MongoError" || error.name === "MongoServerError") {
		handleMongoError(error, apiResponse);
		return;
	}

	if (error.code === "ECONNREFUSED") {
		handleDatabaseConnectionError(error, apiResponse);
		return;
	}

	if (error.name === "JsonWebTokenError") {
		handleJWTError(error, apiResponse);
		return;
	}

	if (error.name === "TokenExpiredError") {
		handleJWTExpiredError(error, apiResponse);
		return;
	}

	if (error.name === "SyntaxError" && error.message.includes("JSON")) {
		handleJSONSyntaxError(error, apiResponse);
		return;
	}

	if (error.code === "LIMIT_FILE_SIZE") {
		handleFileSizeError(error, apiResponse);
		return;
	}

	if (error.code === "EBADCSRFTOKEN") {
		handleCSRFError(error, apiResponse);
		return;
	}

	// Handle HTTP errors with status codes
	if (error.status || error.statusCode) {
		handleHTTPError(error, apiResponse);
		return;
	}

	// Default error handling
	handleGenericError(error, apiResponse);
}

/**
 * Not found handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
	const apiResponse = new ApiResponse(res);
	apiResponse.sendResponse({
		status: StatusCodes.NOT_FOUND,
		message: `Route ${req.method} ${req.originalUrl} not found`
	});
}

/**
 * Async error wrapper to catch async errors in route handlers
 */
export function asyncErrorHandler(
	fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
	return (req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}

/**
 * Initialize all error handlers for the Express app
 */
export function initializeErrorHandlers(app: Express): void {
	// Catch 404 errors for any undefined routes
	app.use(notFoundHandler);

	// Global error handler (must be last)
	app.use(globalErrorHandler);
}

// Helper functions for different error types
function logError(error: any, req: Request): void {
	const timestamp = new Date().toISOString();
	const method = req.method;
	const url = req.originalUrl;
	const userAgent = req.get("User-Agent") || "Unknown";
	const ip = req.ip || req.socket.remoteAddress || "Unknown";

	console.error(pc.red("=".repeat(80)));
	console.error(pc.red(`🚨 ERROR OCCURRED AT: ${timestamp}`));
	console.error(pc.yellow(`📝 REQUEST: ${method} ${url}`));
	console.error(pc.cyan(`🌐 IP: ${ip}`));
	console.error(pc.cyan(`🔍 User-Agent: ${userAgent}`));
	console.error(pc.red(`❌ ERROR NAME: ${error.name || "Unknown"}`));
	console.error(pc.red(`💬 ERROR MESSAGE: ${error.message || "No message"}`));

	if (error.stack) {
		console.error(pc.gray(`📚 STACK TRACE:`));
		console.error(pc.gray(error.stack));
	}

	console.error(pc.red("=".repeat(80)));
}

function handleZodError(error: ZodError, apiResponse: ApiResponse): void {
	const errors = error.issues.map(err => ({
		field: err.path.join("."),
		message: err.message
	}));

	apiResponse.sendResponse({
		status: StatusCodes.BAD_REQUEST,
		message: "Validation failed",
		data: { errors }
	});
}

function handleValidationError(error: any, apiResponse: ApiResponse): void {
	const errors = Object.values(error.issues || {}).map((err: any) => ({
		field: err.path,
		message: err.message
	}));

	apiResponse.sendResponse({
		status: StatusCodes.BAD_REQUEST,
		message: "Validation failed",
		data: { errors }
	});
}

function handleCastError(error: any, apiResponse: ApiResponse): void {
	apiResponse.badResponse(`Invalid ${error.path}: ${error.value}`);
}

function handleMongoError(error: any, apiResponse: ApiResponse): void {
	if (error.code === 11000) {
		const field = Object.keys(error.keyValue || {})[0];
		apiResponse.sendResponse({
			status: StatusCodes.CONFLICT,
			message: `Duplicate value for field: ${field}`
		});
		return;
	}

	apiResponse.internalServerError("Database operation failed");
}

function handleDatabaseConnectionError(error: any, apiResponse: ApiResponse): void {
	apiResponse.sendResponse({
		status: StatusCodes.SERVICE_UNAVAILABLE,
		message: "Database connection failed. Please try again later."
	});
}

function handleJWTError(error: any, apiResponse: ApiResponse): void {
	apiResponse.unauthorizedResponse("Invalid authentication token");
}

function handleJWTExpiredError(error: any, apiResponse: ApiResponse): void {
	apiResponse.unauthorizedResponse("Authentication token has expired");
}

function handleJSONSyntaxError(error: any, apiResponse: ApiResponse): void {
	apiResponse.badResponse("Invalid JSON format in request body");
}

function handleFileSizeError(error: any, apiResponse: ApiResponse): void {
	apiResponse.badResponse("File size exceeds the allowed limit");
}

function handleCSRFError(error: any, apiResponse: ApiResponse): void {
	apiResponse.forbiddenResponse(
		"Invalid CSRF token. Perhaps your browser blocked 3rd-party cookies. Please allow 3rd-party cookies or try a different browser. If the problem persists, please contact support."
	);
}

function handleHTTPError(error: any, apiResponse: ApiResponse): void {
	const status = error.status || error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
	const message = error.message || "An error occurred";

	apiResponse.sendResponse({
		status,
		message
	});
}

function handleGenericError(error: any, apiResponse: ApiResponse): void {
	// In production, don't leak error details
	const isDevelopment = process.env.NODE_ENV === "development";

	apiResponse.sendResponse({
		status: StatusCodes.INTERNAL_SERVER_ERROR,
		message: isDevelopment
			? error.message || "Internal server error"
			: "Something went wrong. Please try again later.",
		...(isDevelopment && { data: { stack: error.stack } })
	});
}

/**
 * Process handlers for uncaught exceptions and unhandled rejections
 * These prevent the application from crashing completely
 */
export function initializeProcessHandlers(): void {
	// Handle uncaught exceptions
	process.on("uncaughtException", (error: Error) => {
		console.error(pc.red("🚨 UNCAUGHT EXCEPTION:"));
		console.error(pc.red(error.name + ": " + error.message));
		console.error(pc.gray(error.stack));

		// Graceful shutdown
		console.log(pc.yellow("🔄 Attempting graceful shutdown..."));
		process.exit(1);
	});

	// Handle unhandled promise rejections
	process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
		console.error(pc.red("🚨 UNHANDLED PROMISE REJECTION:"));
		console.error(pc.red("Reason:"), reason);
		console.error(pc.yellow("Promise:"), promise);

		// Graceful shutdown
		console.log(pc.yellow("🔄 Attempting graceful shutdown..."));
		process.exit(1);
	});

	// Handle SIGTERM (graceful shutdown)
	process.on("SIGTERM", () => {
		console.log(pc.yellow("🛑 SIGTERM received. Starting graceful shutdown..."));
		process.exit(0);
	});

	// Handle SIGINT (Ctrl+C)
	process.on("SIGINT", () => {
		console.log(pc.yellow("🛑 SIGINT received. Starting graceful shutdown..."));
		process.exit(0);
	});
}
