import type { Router } from "express";

import { authenticationRouter } from "@/app/authentication/authentication.routes";
import { mediaRouter } from "@/app/media/media.routes";

import { csrfRouter } from "@/routes/csrf.route";

interface RouteConfig {
	path: string;
	router: Router;
}

export const routes: RouteConfig[] = [
	{ path: "/csrf-token", router: csrfRouter },
	{ path: "/auth", router: authenticationRouter },
	{ path: "/media", router: mediaRouter }
];
