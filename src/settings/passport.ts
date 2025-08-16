import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

import AuthenticationService from "@/app/authentication/authentication.service";

const authenticationService = new AuthenticationService();

// Serialize user for the session
passport.serializeUser((user: Express.User, done) => {
	done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: number, done) => {
	try {
		const userResult = await authenticationService.findUserById(id, false); // false to exclude password
		if (userResult.data) {
			done(null, userResult.data as Express.User);
		} else {
			done(new Error("User not found"), null);
		}
	} catch (error) {
		done(error, null);
	}
});

// Local strategy for username/password authentication
passport.use(
	new LocalStrategy(
		{
			usernameField: "usernameOrEmail",
			passwordField: "password"
		},
		async (usernameOrEmail, password, done) => {
			try {
				const userResult = await authenticationService.findUserByUsernameOrEmail(usernameOrEmail);
				if (!userResult.data) {
					return done(null, false, { message: "Invalid credentials" });
				}

				const passwordCheck = await authenticationService.passwordChecker(
					password,
					userResult.data.password
				);
				if (!passwordCheck.data) {
					return done(null, false, { message: "Invalid credentials" });
				}

				// Get user without password for session
				const userWithoutPassword = await authenticationService.findUserById(
					userResult.data.id,
					false
				);
				return done(null, userWithoutPassword.data as Express.User);
			} catch (error) {
				return done(error);
			}
		}
	)
);

export default passport;
