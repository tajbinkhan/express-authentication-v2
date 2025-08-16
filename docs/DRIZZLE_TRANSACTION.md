# DrizzleService - Type-Safe Transaction Management

A TypeScript abstract base class for Drizzle ORM services that provides seamless transaction
management without polluting method signatures.

## Features

- 🔒 Type-safe transaction handling
- 🧹 Clean method signatures - no need to pass transaction objects to every method
- 🔄 Flexible usage - works with or without transactions
- 🏗️ Inheritance-based - extend for your specific services
- 🎯 Zero configuration - drop-in replacement for existing services

## Installation

```bash
npm install drizzle-orm
```

## Basic Setup

### 1. Create the Base Service

```typescript
// services/DrizzleService.ts
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
```

### 2. Create Your Service Classes

```typescript
// services/UserService.ts
import { eq } from "drizzle-orm";

import DrizzleService from "./DrizzleService";
import { users } from "@/databases/drizzle/schema";

export default class UserService extends DrizzleService {
	async create(userData: CreateUserData): Promise<User> {
		const db = this.getDb();
		const [user] = await db.insert(users).values(userData).returning();
		return user;
	}

	async findByEmail(email: string): Promise<User | null> {
		const db = this.getDb();
		const [user] = await db.select().from(users).where(eq(users.email, email));
		return user || null;
	}

	async update(id: string, userData: UpdateUserData): Promise<User> {
		const db = this.getDb();
		const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
		return user;
	}

	async delete(id: string): Promise<void> {
		const db = this.getDb();
		await db.delete(users).where(eq(users.id, id));
	}
}
```

## Usage Examples

### Normal Operations (Without Transaction)

```typescript
const userService = new UserService();

// Each operation commits immediately
const user = await userService.create({
	name: "John Doe",
	email: "john@example.com"
});

const foundUser = await userService.findByEmail("john@example.com");
```

### With Transactions

```typescript
const userService = new UserService();
const profileService = new ProfileService();

await db.transaction(async tx => {
	// Set transaction context
	userService.setTransaction(tx);
	profileService.setTransaction(tx);

	// All operations use the same transaction
	const user = await userService.create({
		name: "John Doe",
		email: "john@example.com"
	});

	const profile = await profileService.create({
		userId: user.id,
		bio: "Software Developer"
	});

	// If any operation fails, all will rollback
	// If all succeed, all will commit together
});
```

### Method Chaining

```typescript
const userService = new UserService();

await db.transaction(async tx => {
	const user = await userService.setTransaction(tx).create(userData);

	const updatedUser = await userService.update(user.id, { verified: true });
});
```

## Real-World Examples

### 1. User Registration

```typescript
async function registerUser(userData: CreateUserData, profileData: CreateProfileData) {
	const userService = new UserService();
	const profileService = new ProfileService();

	return await db.transaction(async tx => {
		userService.setTransaction(tx);
		profileService.setTransaction(tx);

		const user = await userService.create(userData);
		const profile = await profileService.create({
			...profileData,
			userId: user.id
		});

		return { user, profile };
	});
}
```

### 2. E-commerce Order Processing

```typescript
async function processOrder(orderData: CreateOrderData, items: OrderItem[]) {
	const orderService = new OrderService();
	const productService = new ProductService();
	const paymentService = new PaymentService();

	return await db.transaction(async tx => {
		orderService.setTransaction(tx);
		productService.setTransaction(tx);
		paymentService.setTransaction(tx);

		// Check stock availability
		for (const item of items) {
			const stock = await productService.getStock(item.productId);
			if (stock < item.quantity) {
				throw new Error(`Insufficient stock for product ${item.productId}`);
			}
		}

		// Create order
		const order = await orderService.create(orderData);

		// Update stock
		for (const item of items) {
			await productService.updateStock(item.productId, item.quantity);
		}

		// Process payment
		const payment = await paymentService.processPayment({
			orderId: order.id,
			amount: orderData.total
		});

		return { order, payment };
	});
}
```

### 3. Money Transfer

```typescript
async function transferMoney(fromAccountId: string, toAccountId: string, amount: number) {
	const accountService = new AccountService();
	const transactionService = new TransactionService();

	return await db.transaction(async tx => {
		accountService.setTransaction(tx);
		transactionService.setTransaction(tx);

		// Check balance
		const balance = await accountService.getBalance(fromAccountId);
		if (balance < amount) {
			throw new Error("Insufficient funds");
		}

		// Transfer money
		await accountService.debit(fromAccountId, amount);
		await accountService.credit(toAccountId, amount);

		// Record transaction
		return await transactionService.create({
			fromAccountId,
			toAccountId,
			amount,
			type: "transfer"
		});
	});
}
```

## Best Practices

### 1. Always Clean Up

```typescript
async function safeOperation() {
	const userService = new UserService();

	try {
		await db.transaction(async tx => {
			userService.setTransaction(tx);
			await userService.create(userData);
		});
	} finally {
		userService.clearTransaction();
	}
}
```

### 2. Helper Function for Multiple Services

```typescript
async function withTransaction<T>(
	services: DrizzleService[],
	callback: () => Promise<T>
): Promise<T> {
	try {
		return await db.transaction(async tx => {
			services.forEach(service => service.setTransaction(tx));
			return await callback();
		});
	} finally {
		services.forEach(service => service.clearTransaction());
	}
}

// Usage
await withTransaction([userService, profileService], async () => {
	await userService.create(userData);
	await profileService.create(profileData);
});
```

### 3. Service Lifecycle Management

```typescript
class OrderProcessor {
	private userService = new UserService();
	private orderService = new OrderService();

	async processOrder(orderData: OrderData) {
		try {
			await db.transaction(async tx => {
				this.userService.setTransaction(tx);
				this.orderService.setTransaction(tx);

				await this.userService.validateUser(orderData.userId);
				await this.orderService.create(orderData);
			});
		} finally {
			this.userService.clearTransaction();
			this.orderService.clearTransaction();
		}
	}
}
```

## Testing

```typescript
describe("UserService", () => {
	const userService = new UserService();

	afterEach(() => {
		userService.clearTransaction();
	});

	it("should work with transaction", async () => {
		await db.transaction(async tx => {
			userService.setTransaction(tx);
			const user = await userService.create(testUserData);
			expect(user).toBeDefined();
		});
	});

	it("should work without transaction", async () => {
		const user = await userService.create(testUserData);
		expect(user).toBeDefined();
	});
});
```

## Key Benefits

- **Data Consistency**: All operations in a transaction succeed or fail together
- **Clean Architecture**: No transaction parameters cluttering method signatures
- **Flexibility**: Services work with or without transactions
- **Type Safety**: Full TypeScript support with proper type inference
- **Reusability**: Easy to compose complex operations from simple services
- **Error Handling**: Automatic rollback on any failure within transaction

## API Reference

### DrizzleService Methods

- `setTransaction(tx: DrizzleTransaction): this` - Set transaction context
- `clearTransaction(): this` - Clear transaction context
- `getDb(): typeof db | DrizzleTransaction` - Get appropriate database connection

## When to Use Transactions

Use transactions when you need:

- **Atomic operations** - All succeed or all fail
- **Data consistency** - Related operations must be synchronized
- **Error recovery** - Rollback on any failure
- **Complex operations** - Multiple related database changes

Examples: User registration, order processing, money transfers, data migrations.

## Migration from Existing Services

If you have existing services that pass transaction parameters:

```typescript
// Before
class UserService {
	async create(userData: CreateUserData, tx: any = db) {
		const [user] = await tx.insert(users).values(userData).returning();
		return user;
	}
}

// After
class UserService extends DrizzleService {
	async create(userData: CreateUserData): Promise<User> {
		const db = this.getDb();
		const [user] = await db.insert(users).values(userData).returning();
		return user;
	}
}
```

Simply extend `DrizzleService` and replace transaction parameters with `this.getDb()`.
