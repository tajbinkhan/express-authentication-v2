import type { Response } from "express";
import { StatusCodes } from "http-status-codes";

/** =========================
 *  Types
 *  ========================= */

type HttpStatusCode = number;

export interface Pagination {
	totalItems: number;
	limit: number;
	offset: number;
	currentPage: number;
	totalPages: number;
	hasPrevPage: boolean;
	hasNextPage: boolean;
	prevPage: number | null;
	nextPage: number | null;
}

/** What the client receives (server-generated success) */
interface BaseApiResponse {
	status: HttpStatusCode;
	message: string;
	success: boolean; // derived (not accepted from callers)
}

/** Response shape that your services/controllers can RETURN (success is NOT provided by callers) */
export interface ServiceApiResponse<T> {
	status: HttpStatusCode;
	message: string;
	data: T;
	pagination?: Pagination;
}

/** Params accepted by ApiResponse.sendResponse (no success allowed) */
export interface ServiceSendApiResponse<T> {
	status: HttpStatusCode;
	message: string;
	data?: T;
	pagination?: Pagination;
}

/** Legacy compatibility type detection (not required to pass success) */
export interface ApiError extends BaseApiResponse {
	error?: string;
}

/** =========================
 *  Internals
 *  ========================= */

const NO_CONTENT_STATUSES = new Set([StatusCodes.NO_CONTENT]);
const isSuccessStatus = (status: HttpStatusCode): boolean => status >= 200 && status < 300;

/** Proper error with stack + status */
export class HttpError extends Error {
	status: number;
	expose: boolean;

	constructor(status: number, message: string, opts?: { cause?: unknown; expose?: boolean }) {
		super(message, { cause: opts?.cause });
		this.name = "HttpError";
		this.status = status;
		this.expose = opts?.expose ?? (status >= 400 && status < 500);
		Error.captureStackTrace?.(this, HttpError);
	}
}

const isApiErrorShape = (error: unknown): error is ApiError =>
	error !== null &&
	typeof error === "object" &&
	"status" in error &&
	typeof (error as ApiError).status === "number" &&
	"message" in error &&
	typeof (error as ApiError).message === "string" &&
	"success" in error &&
	typeof (error as ApiError).success === "boolean";

/** =========================
 *  ServiceResponse
 *  ========================= */

export class ServiceResponse {
	/**
	 * Build a success/normal payload for controllers/services.
	 * NOTE: no `success` param; it is derived later based on `status`.
	 */
	static createResponse<T>(
		status: HttpStatusCode,
		message: string,
		data: T,
		pagination?: Pagination
	): ServiceApiResponse<T> {
		return { status, message, data, pagination };
	}

	/**
	 * Throw a proper error with stack (no object-throws).
	 */
	static createRejectResponse<T>(status: HttpStatusCode, message: string): never {
		throw new HttpError(status, message);
	}

	/**
	 * Normalize unknown errors to HttpError and rethrow.
	 */
	static createErrorResponse(error: unknown): never {
		if (error instanceof Error) {
			console.error("Error:", {
				message: error.message,
				stack: error.stack,
				cause: (error as any)?.cause
			});
		} else {
			console.error("Error (non-Error):", error);
		}

		if (error instanceof HttpError) throw error;

		if (isApiErrorShape(error)) {
			throw new HttpError(error.status, error.message, { expose: error.status < 500 });
		}

		throw new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", {
			cause: error,
			expose: false
		});
	}
}

/** =========================
 *  ApiResponse (HTTP sender)
 *  ========================= */

export class ApiResponse {
	constructor(private readonly res: Response) {}

	successResponse<T>(message: string, data?: T, pagination?: Pagination) {
		return this.sendResponse<T>({ status: StatusCodes.OK, message, data, pagination });
	}

	unauthorizedResponse(message: string) {
		return this.sendResponse({ status: StatusCodes.UNAUTHORIZED, message });
	}

	forbiddenResponse(message: string) {
		return this.sendResponse({ status: StatusCodes.FORBIDDEN, message });
	}

	badResponse(message: string) {
		return this.sendResponse({ status: StatusCodes.BAD_REQUEST, message });
	}

	internalServerError(message = "Internal Server Error") {
		return this.sendResponse({ status: StatusCodes.INTERNAL_SERVER_ERROR, message });
	}

	/**
	 * Centralized sender. `success` is ALWAYS derived from `status`.
	 */
	sendResponse<T>({ status, message, data, pagination }: ServiceSendApiResponse<T>): Response {
		if (NO_CONTENT_STATUSES.has(status)) {
			// 204 MUST NOT include any body
			return this.res.status(status).end();
		}

		const wire: BaseApiResponse & { data?: T; pagination?: Pagination } = {
			status,
			success: isSuccessStatus(status),
			message,
			...(data !== undefined ? { data } : {}),
			...(pagination ? { pagination } : {})
		};

		return this.res.status(status).json(wire);
	}
}
