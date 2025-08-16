# OneDesk API Seeding System

The OneDesk API includes a comprehensive database seeding system that helps you populate your
database with initial data for development and testing purposes.

## Architecture

The seeding system follows a modular architecture with a main orchestrator (`SuperSeeder`) that
manages individual seeders:

```
src/seed/
├── superSeeder.ts          # Main orchestrator
├── user/
│   └── userSeed.ts        # User seeder
├── emailTemplate/
│   └── emailTemplateSeed.ts # Email template seeder
└── todo/
    └── todoSeed.ts        # Todo seeder
```

## Available Seeders

### 1. **UserSeeder** (`src/seed/user/userSeed.ts`)

Creates sample users with different roles:

- **Super Admin**: `superadmin@onedesk.com` / `SuperAdmin123`
- **Admin**: `admin@onedesk.com` / `Admin123`
- **Supervisor**: `supervisor@onedesk.com` / `Supervisor123`
- **Agent 1**: `agent1@onedesk.com` / `Agent123`
- **Agent 2**: `agent2@onedesk.com` / `Agent123`
- **Test User**: `test@onedesk.com` / `Test123` (unverified)

### 2. **EmailTemplateSeeder** (`src/seed/emailTemplate/emailTemplateSeed.ts`)

Creates default email templates for:

- Login OTP verification
- Password reset
- Email verification
- Welcome messages

### 3. **TodoSeeder** (`src/seed/todo/todoSeed.ts`)

Creates sample todo items for testing:

- Welcome tasks
- Setup reminders
- Team management tasks
- System maintenance tasks

## Usage

### Run All Seeders

```bash
npm run db:seed
# or
npm run db:seed all
```

### Run Individual Seeders

```bash
# Users only
npm run db:seed users

# Email templates only
npm run db:seed emails

# Todos only
npm run db:seed todos
```

### Clear All Seeded Data

```bash
npm run db:seed clear
```

## Features

- **✅ Duplicate Prevention**: Automatically detects existing data to prevent duplicates
- **📊 Progress Tracking**: Detailed logging with success/failure counts
- **🔄 Error Handling**: Graceful error handling with meaningful messages
- **🎯 Selective Seeding**: Run individual seeders or all at once
- **🧹 Data Cleanup**: Clear seeded data for fresh starts
- **📋 Credential Summary**: Displays default login credentials after user seeding

## Package.json Scripts

The following npm scripts are available for database seeding:

### Main Seeding Commands

- **`npm run db:seed`** - Run all seeders (users, email templates, and todos)
- **`npm run db:seed:users`** - Run only the user seeder
- **`npm run db:seed:emails`** - Run only the email template seeder
- **`npm run db:seed:todos`** - Run only the todo seeder
- **`npm run db:seed:clear`** - Clear all seeded data

### Database Management

- **`npm run db:reset`** - Complete database reset: clear → migrate → seed
- **`npm run db:clear`** - Clear database and run migrations
- **`npm run db:migrate`** - Run database migrations
- **`npm run db:generate`** - Generate migration files from schema changes

### Usage Examples

```bash
# Fresh start - reset everything and populate with sample data
npm run db:reset

# Add only users for testing authentication
npm run db:seed:users

# Clear all seeded data and start fresh
npm run db:seed:clear && npm run db:seed

# Add specific data types
npm run db:seed:emails
npm run db:seed:todos
```

## Adding New Seeders

To add a new seeder (e.g., for Projects):

1. **Create the seeder class** in `src/seed/project/projectSeed.ts`:

```typescript
export default class ProjectSeeder {
	// Implementation similar to existing seeders
}
```

2. **Import and integrate** in `src/seed/superSeeder.ts`:

```typescript
import ProjectSeeder from "@/seed/project/projectSeed";

export default class SuperSeeder {
	private projectSeeder: ProjectSeeder;

	constructor() {
		this.projectSeeder = new ProjectSeeder();
	}

	async runAll(): Promise<void> {
		// Add to the seeding sequence
		await this.projectSeeder.run();
	}
}
```

3. **Update CLI options** in the same file for individual execution.

## Best Practices

- **Order Matters**: Seed dependencies first (e.g., users before todos that reference users)
- **Idempotent Operations**: Ensure seeders can be run multiple times safely
- **Meaningful Data**: Create realistic sample data that helps with development
- **Error Logging**: Provide clear feedback for debugging
- **Environment Awareness**: Consider different data sets for development vs staging

## Database Management

The seeding system works alongside other database scripts:

```bash
# Reset database completely and run migrations + seeds
npm run db:clear && npm run db:migrate && npm run db:seed

# Just generate and migrate without seeding
npm run db:generate && npm run db:migrate

# View database in Drizzle Studio
npm run db:studio
```

## Security Notes

- Default passwords are for development only
- Change or remove default users in production
- Email templates should be customized for your brand
- Consider environment-specific seeding strategies
