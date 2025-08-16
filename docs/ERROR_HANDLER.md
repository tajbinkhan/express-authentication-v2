# Global Error Handler Documentation

This document explains how to use the global error handler in your Express application to prevent
crashes and handle errors gracefully.

## Overview

The global error handler system consists of several components:

1. **Global Error Handler Middleware** - Catches and handles all types of errors
2. **Process-level Error Handlers** - Prevents application crashes from uncaught exceptions
3. **Async Error Wrapper** - Automatically catches async errors in route handlers
4. **Not Found Handler** - Handles 404 errors for undefined routes

## Features

### ✅ Prevents Application Crashes

- Catches uncaught exceptions and unhandled promise rejections
- Graceful shutdown on critical errors
- Comprehensive error logging

### ✅ Handles Multiple Error Types

- **Zod Validation Errors** - Formatted validation error responses
- **MongoDB/Database Errors** - Database connection and operation errors
- **JWT Errors** - Authentication token errors
- **CSRF Errors** - Cross-site request forgery protection
- **HTTP Errors** - Status code based errors
- **File Upload Errors** - File size and format errors
- **JSON Syntax Errors** - Malformed JSON requests

### ✅ Smart Error Responses

- Development vs Production error details
- Consistent API response format
- Detailed logging for debugging
- Color-coded console output

## Usage

### 1. Basic Route Handler with Error Handling

```typescript
import { asyncErrorHandler } from "@/settings/errorHandler";
import { ApiResponse } from "@/utils/serviceApi";

// Wrap async route handlers
router.get(
	"/users",
	asyncErrorHandler(async (req, res) => {
		// Any errors thrown here will be automatically caught
		const users = await getUsersFromDatabase();
		new ApiResponse(res).successResponse("Users retrieved successfully", users);
	})
);
```

### 2. Manual Error Throwing

```typescript
router.get(
	"/users/:id",
	asyncErrorHandler(async (req, res) => {
		const { id } = req.params;

		if (!id) {
			const error = new Error("User ID is required");
			error.status = 400; // Set custom status code
			throw error;
		}

		const user = await getUserById(id);

		if (!user) {
			const error = new Error("User not found");
			error.status = 404;
			throw error;
		}

		new ApiResponse(res).successResponse("User found", user);
	})
);
```

### 3. Validation Error Handling

```typescript
import { z } from "zod";

const userSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email format")
});

router.post(
	"/users",
	asyncErrorHandler(async (req, res) => {
		// Zod validation errors are automatically handled
		const validatedData = userSchema.parse(req.body);

		const user = await createUser(validatedData);
		new ApiResponse(res).successResponse("User created successfully", user);
	})
);
```

### 4. Database Error Handling

```typescript
router.get(
	"/posts",
	asyncErrorHandler(async (req, res) => {
		// Database connection errors are automatically handled
		const posts = await Post.find();
		new ApiResponse(res).successResponse("Posts retrieved", posts);
	})
);
```

## Error Response Format

All errors return a consistent JSON format:

```json
{
	"status": 400,
	"message": "Validation failed",
	"data": {
		"errors": [
			{
				"field": "email",
				"message": "Invalid email format"
			}
		]
	}
}
```

## Error Types and Status Codes

| Error Type            | Status Code | Description                      |
| --------------------- | ----------- | -------------------------------- |
| Validation Error      | 400         | Zod or other validation failures |
| Authentication Error  | 401         | Invalid or expired JWT tokens    |
| CSRF Error            | 403         | Invalid CSRF token               |
| Not Found             | 404         | Route or resource not found      |
| Duplicate Error       | 409         | MongoDB duplicate key error      |
| File Size Error       | 400         | File upload size exceeded        |
| Database Connection   | 503         | Database unavailable             |
| Internal Server Error | 500         | Generic server errors            |

## Logging

Errors are logged with the following information:

```
🚨 ERROR OCCURRED AT: 2024-01-01T12:00:00.000Z
📝 REQUEST: POST /api/users
🌐 IP: 192.168.1.1
🔍 User-Agent: Mozilla/5.0...
❌ ERROR NAME: ValidationError
💬 ERROR MESSAGE: Validation failed
📚 STACK TRACE: ...
```

## Environment Considerations

### Development Mode

- Full error details in responses
- Stack traces included
- Detailed console logging

### Production Mode

- Generic error messages for security
- No stack traces exposed
- Error details logged server-side only

## Best Practices

### ✅ DO

- Always use `asyncErrorHandler` for async route handlers
- Throw errors with appropriate status codes
- Use descriptive error messages
- Validate input data early in route handlers

### ❌ DON'T

- Don't use try/catch with `asyncErrorHandler` (redundant)
- Don't expose sensitive information in error messages
- Don't forget to set appropriate HTTP status codes
- Don't log sensitive data like passwords or tokens

## Testing Error Handling

You can test the error handler by creating routes that intentionally throw errors:

```typescript
// Test route for development
router.get(
	"/test-error",
	asyncErrorHandler(async (req, res) => {
		throw new Error("This is a test error");
	})
);

// Test validation error
router.post(
	"/test-validation",
	asyncErrorHandler(async (req, res) => {
		const schema = z.object({
			required: z.string()
		});
		schema.parse(req.body); // Will throw if validation fails
	})
);
```

## Process-Level Error Handling

The system also handles process-level errors:

- **Uncaught Exceptions** - Logs error and gracefully shuts down
- **Unhandled Promise Rejections** - Logs error and gracefully shuts down
- **SIGTERM/SIGINT** - Graceful shutdown on termination signals

This ensures your application never crashes unexpectedly and always shuts down cleanly.

## Monitoring

Consider integrating with monitoring services like:

- **Sentry** for error tracking
- **LogRocket** for session replay
- **Datadog** for application monitoring
- **New Relic** for performance monitoring

The error handler provides hooks for these integrations through the logging functions.
