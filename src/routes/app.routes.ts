import type { Router } from "express";

import { authenticationRouter } from "@/app/authentication/authentication.routes";
import { userRouter } from "@/app/user/user.routes";

import { csrfRouter } from "@/routes/csrf.route";

interface RouteConfig {
	path: string;
	router: Router;
}

export const routes: RouteConfig[] = [
	{ path: "/csrf-token", router: csrfRouter },
	{ path: "/auth", router: authenticationRouter },
	{ path: "/user", router: userRouter }
];
