# Express Authentication v2

A robust Express.js authentication API with advanced security features, built with TypeScript,
Drizzle ORM, and comprehensive authentication strategies.

## Features

- 🔐 **Multiple Authentication Methods**
  - Local authentication (email/password)
  - Google OAuth 2.0 integration
  - Passport.js integration

- 🛡️ **Security Features**
  - CSRF protection
  - Rate limiting
  - Helmet security headers
  - Session management
  - Password hashing with bcrypt
  - Input validation with Zod

- 📧 **Email Services**
  - Email verification
  - Password reset
  - Template-based emails with Handlebars
  - Nodemailer integration

- 🗄️ **Database Support**
  - PostgreSQL with Drizzle ORM
  - MongoDB with Mongoose
  - Database migrations and seeding

- 🔧 **Developer Experience**
  - TypeScript support
  - Hot reload with Nodemon
  - ESLint and Prettier configuration
  - Comprehensive error handling
  - Structured logging

## Tech Stack

- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL (Drizzle ORM), MongoDB (Mongoose)
- **Authentication**: Passport.js, bcrypt
- **Validation**: Zod
- **Email**: Nodemailer, Handlebars
- **Security**: Helmet, CORS, Rate Limiting, CSRF
- **File Upload**: Multer, Cloudinary
- **Build Tools**: tsup, ESLint, Prettier

## Prerequisites

- Node.js >= 20.0.0
- PostgreSQL database
- MongoDB database (optional)
- PNPM package manager

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/tajbinkhan/express-authentication-v2.git
   cd express-authentication-v2
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables:

   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/dbname
   MONGODB_URI=mongodb://localhost:27017/your-db-name

   # Session
   SESSION_SECRET=your-super-secret-session-key

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Email
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your-email@example.com
   SMTP_PASS=your-email-password

   # Cloudinary (for file uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Database Setup**

   ```bash
   # Generate and run migrations
   pnpm db:generate
   pnpm db:migrate

   # Seed the database
   pnpm db:seed
   ```

## Development

```bash
# Start development server with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Format code
pnpm format

# Type checking
pnpm type-check
```

## Database Commands

```bash
# Database studio (GUI)
pnpm db:studio

# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema changes
pnpm db:push

# Clear database
pnpm db:clear

# Seed database
pnpm db:seed

# Reset database (clear + migrate + seed)
pnpm db:reset
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

### User Management

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/change-password` - Change password

### Email Services

- `POST /api/email/verify` - Send verification email
- `POST /api/email/forgot-password` - Send password reset email
- `POST /api/email/reset-password` - Reset password

## Project Structure

```
src/
├── app/                    # Feature modules
│   ├── authentication/    # Auth controllers, services, routes
│   ├── email/             # Email functionality
│   ├── emailTemplate/     # Email template services
│   └── user/              # User management
├── core/                  # Core utilities and constants
├── databases/             # Database configurations and helpers
├── mailer/                # Email configuration and services
├── middlewares/           # Custom middleware
├── models/                # Database models
├── passport/              # Passport strategies
├── routes/                # Route configurations
├── seed/                  # Database seeders
├── service/               # Business logic services
├── settings/              # App configuration
├── utils/                 # Utility functions
└── validators/            # Input validation schemas
```

## Security Features

- **CSRF Protection**: Double submit cookie pattern
- **Rate Limiting**: Configurable rate limits per endpoint
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries with Drizzle ORM
- **XSS Protection**: Helmet security headers
- **Session Security**: Secure session configuration
- **Password Security**: bcrypt hashing with salt rounds

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Follow the existing code style (ESLint/Prettier)
- Update documentation as needed
- Ensure all tests pass before submitting PR

## Testing

```bash
# Run tests (when implemented)
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Deployment

### Using Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the deployment prompts

### Using Docker

```bash
# Build Docker image
docker build -t express-auth-v2 .

# Run container
docker run -p 3000:3000 express-auth-v2
```

### Environment Variables for Production

Make sure to set all required environment variables in your production environment:

- `NODE_ENV=production`
- `DATABASE_URL`
- `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- Email configuration variables
- Cloudinary configuration variables

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify your `DATABASE_URL` is correct
   - Ensure PostgreSQL is running
   - Check firewall settings

2. **OAuth Issues**
   - Verify Google OAuth credentials
   - Check redirect URIs in Google Console
   - Ensure correct domain configuration

3. **Email Issues**
   - Verify SMTP configuration
   - Check email provider settings
   - Ensure firewall allows SMTP connections

## Performance

- Database connection pooling
- Session store optimization
- Rate limiting to prevent abuse
- Efficient query patterns with Drizzle ORM
- Optimized middleware ordering

## Monitoring and Logging

- Structured logging with custom logger
- Request/response logging
- Error tracking and reporting
- Performance monitoring capabilities

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Express.js](https://expressjs.com/) - Fast, unopinionated, minimalist web framework
- [Passport.js](http://www.passportjs.org/) - Simple, unobtrusive authentication
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM for SQL databases
- [Zod](https://zod.dev/) - TypeScript-first schema validation

## Support

If you encounter any issues or have questions, please:

1. Check the [documentation](docs/)
2. Search existing [issues](https://github.com/tajbinkhan/express-authentication-v2/issues)
3. Create a new issue if needed

---

**Made with ❤️ by [Tajbin Khan](https://github.com/tajbinkhan)**
