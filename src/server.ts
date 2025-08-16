import ip from "ip";
import pc from "picocolors";

import app from "@/app";
import "@/core/env";
import { initializeProcessHandlers } from "@/settings/errorHandler";
import getExpressVersion from "@/settings/version";

const expressVersion = getExpressVersion();

// Initialize process-level error handlers
initializeProcessHandlers();

const startServer = async () => {
	try {
		const port = process.env.PORT || 8080;
		const ipAddress = ip.address();
		const ENV = process.env.NODE_ENV || "development";

		app.listen(port, () => {
			console.log(pc.magenta(`\n▲ Express.js ${expressVersion}`));
			console.log(`- Local:        http://localhost:${port}`);
			console.log(`- Network:      http://${ipAddress}:${port}`);
			console.log(`- Environment:  ${ENV}`);
			console.log();
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
};

startServer();
