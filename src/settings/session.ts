import session from "express-session";

import { sessionTimeout } from "@/core/constants";
import DrizzleSessionStore from "@/settings/customSessionStore";
import AppHelpers from "@/utils/appHelpers";

const sessionConfig = session({
	name: process.env.SESSION_COOKIE_NAME,
	secret: process.env.SECRET,
	saveUninitialized: false,
	resave: false,
	store: new DrizzleSessionStore(),
	cookie: {
		sameSite: AppHelpers.sameSiteCookieConfig().sameSite,
		secure: AppHelpers.sameSiteCookieConfig().secure,
		maxAge: sessionTimeout,
		...(AppHelpers.sameSiteCookieConfig().domain && {
			domain: AppHelpers.sameSiteCookieConfig().domain
		})
	}
});

export default sessionConfig;
