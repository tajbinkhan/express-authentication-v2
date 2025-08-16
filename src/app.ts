import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { urlencoded } from "express";
import helmet from "helmet";
import passport from "passport";

import "@/passport/google";
import "@/passport/local";
import indexRouter from "@/routes/index.route";
import appRouter from "@/routes/routes.config";
import { corsOptions } from "@/settings/cors";
import { initializeErrorHandlers } from "@/settings/errorHandler";
import appLogger from "@/settings/logger";
import appRateLimiter from "@/settings/rateLimiter";
import sessionConfig from "@/settings/session";
import { doubleCsrfProtection } from "@/utils/csrf";
import domainStore from "@/utils/domainStore";

dotenv.config();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));

/**
 * Initialize logger
 * This will log all requests to the server
 * This is to monitor the server
 */
appLogger(app);

/**
 * Rate limiter for all requests
 * This will limit the number of requests to the server
 * This is to prevent abuse of the server
 */
appRateLimiter(app);

/**
 * Store client and server domain
 * This is used to store the client and server domain
 * This is used for authentication
 */
app.use(domainStore);

/**
 * Initialize session
 * This is used to store session data
 * This is used for authentication
 */
app.set("trust proxy", 1);
app.use(sessionConfig);

/**
 * Initialize passport
 * This is used for authentication
 */
app.use(passport.initialize());
app.use(passport.session());

// Generate CSRF token for all routes
app.use(doubleCsrfProtection);

/**
 * Default route
 * This is the default route for the server
 */
indexRouter(app);

/**
 * Initialize all routes are handled in the api.ts file
 * All routes will start with /
 * Example: http://localhost:8080/auth/login
 */
appRouter(app);

/**
 * Initialize global error handlers
 * This will handle all errors and prevent the server from crashing
 * This includes 404 errors and all other types of errors
 */
initializeErrorHandlers(app);

export default app;
