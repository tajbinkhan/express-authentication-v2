import type { NextFunction, Request, Response } from "express";

import { ROLE_LIST } from "@/databases/drizzle/lists";
import type { RoleType } from "@/databases/drizzle/types";
import { asyncErrorHandler } from "@/settings/errorHandler";
import { ApiResponse } from "@/utils/serviceApi";

/**
 * Check if user has required role
 */
function hasRequiredRole(userRole: RoleType, requiredRole: RoleType): boolean {
	return userRole === requiredRole;
}

/**
 * Authorization middleware to check if user has required role(s)
 * @param allowedRoles - Array of roles that are allowed to access the resource
 * @returns Express middleware function
 */
export function authorize(allowedRoles: RoleType[]) {
	const authorizationHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		const apiResponse = new ApiResponse(res);

		// Check if user is authenticated (should be done by authentication middleware first)
		if (!req.user) {
			apiResponse.unauthorizedResponse("Unauthorized: User not found");
			return;
		}

		const userRole = req.user.role;

		// Check if user has any of the allowed roles
		const hasPermission = allowedRoles.some(allowedRole => hasRequiredRole(userRole, allowedRole));

		if (!hasPermission) {
			apiResponse.forbiddenResponse(
				`Forbidden: Insufficient permissions. Required role(s): ${allowedRoles.join(", ")}`
			);
			return;
		}

		next();
	};

	return asyncErrorHandler(authorizationHandler);
}

/**
 * Specific role-based authorization middlewares
 */

/**
 * Only allow administrators
 */
export const requireAdmin = authorize([ROLE_LIST.ADMIN]);

/**
 * Allow supervisors and administrators
 */
export const requireSupervisor = authorize([ROLE_LIST.SUPERVISOR]);

/**
 * Check if user owns the resource or has sufficient permissions
 * @param getUserId - Function to extract user ID from request parameters
 * @param fallbackRoles - Roles that can access any resource regardless of ownership
 */
export function authorizeOwnershipOrRole(
	getUserId: (req: Request) => number | string | undefined,
	fallbackRoles: RoleType[] = [ROLE_LIST.ADMIN, ROLE_LIST.SUPERVISOR]
) {
	const ownershipAuthorizationHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		const apiResponse = new ApiResponse(res);

		// Check if user is authenticated
		if (!req.user) {
			apiResponse.unauthorizedResponse("Unauthorized: User not found");
			return;
		}

		const currentUserId = req.user.id;
		const resourceUserId = getUserId(req);
		const userRole = req.user.role;

		// Convert to numbers for comparison if needed
		const normalizedCurrentUserId = Number(currentUserId);
		const normalizedResourceUserId = Number(resourceUserId);

		// Check if user owns the resource
		if (normalizedCurrentUserId === normalizedResourceUserId) {
			next();
			return;
		}

		// Check if user has fallback role permissions
		const hasFallbackPermission = fallbackRoles.some(allowedRole =>
			hasRequiredRole(userRole, allowedRole)
		);

		if (!hasFallbackPermission) {
			apiResponse.forbiddenResponse(
				"Forbidden: You can only access your own resources or need higher permissions"
			);
			return;
		}

		next();
	};

	return asyncErrorHandler(ownershipAuthorizationHandler);
}

/**
 * Common ownership authorization for user ID in params
 */
export const authorizeUserOwnership = authorizeOwnershipOrRole(
	(req: Request) => req.params.userId || req.params.id
);

/**
 * Check if user email is verified
 */
const emailVerifiedHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	const apiResponse = new ApiResponse(res);

	if (!req.user) {
		apiResponse.unauthorizedResponse("Unauthorized: User not found");
		return;
	}

	if (!req.user.emailVerified) {
		apiResponse.forbiddenResponse("Forbidden: Please verify your email address first");
		return;
	}

	next();
};

export const requireVerifiedEmail = asyncErrorHandler(emailVerifiedHandler);
