import db from "@/databases/drizzle/connection";

// Define the transaction type (adjust based on your Drizzle setup)
type DrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export default abstract class DrizzleService {
	protected db: typeof db;
	private currentTx: DrizzleTransaction | null = null;

	constructor() {
		this.db = db;
	}

	// Set transaction context for the service instance
	setTransaction(tx: DrizzleTransaction): this {
		this.currentTx = tx;
		return this;
	}

	// Clear transaction context
	clearTransaction(): this {
		this.currentTx = null;
		return this;
	}

	// Get the appropriate database connection
	protected getDb(): typeof db | DrizzleTransaction {
		return this.currentTx || this.db;
	}
}
