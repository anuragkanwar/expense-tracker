# Pocket Pixie API 🧚‍♀️

Backend API server for the Pocket Pixie mobile application, built with Hono, TypeScript, and modern web technologies.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up database
pnpm run db:generate
pnpm run db:migrate

# Start development server
pnpm run dev
```

The API will be available at `http://localhost:3000`

## 📋 Overview

This API server provides:

- **Authentication endpoints** using Better Auth
- **RESTful API** for mobile app communication
- **SQLite database** with Drizzle ORM
- **Type-safe** request/response handling
- **CORS configuration** for mobile app access

## 🏗️ Architecture

### Tech Stack

- **Runtime:** Bun
- **Framework:** Hono
- **Database:** SQLite + Drizzle ORM
- **Auth:** Better Auth
- **Validation:** Zod (via validators package)
- **Language:** TypeScript

### Dependencies

- `@pocket-pixie/auth` - Authentication logic
- `@pocket-pixie/db` - Database connection and schemas
- `@pocket-pixie/validators` - Request/response validation

## 🛠️ Development

### Prerequisites

- Bun >= 1.0.0
- Node.js >= 18.0.0

### Environment Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Database setup:**

   ```bash
   # Generate TypeScript types and migrations for all databases
   pnpm run db:generate:all

   # Run migrations for all databases
   pnpm run db:migrate:all
   ```

3. **Environment variables:**
   The API uses environment variables from the root `.env` file:
   ```bash
   BETTER_AUTH_SECRET=your-secret-key-here
   BETTER_AUTH_URL=http://localhost:3000
   DATABASE_URL=./packages/db/local.db
   AUTH_DATABASE_URL=./packages/auth/auth.db
   ```

### Development Commands

```bash
# Start development server with hot reload
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm run start

# Type checking
pnpm run check-types

# Linting
pnpm run lint

# Testing
pnpm run test

# Clean build artifacts
pnpm run clean
```

## 🔌 API Endpoints

### Public Endpoints

- `GET /` - Basic API information
- `GET /health` - Health check with system status
- `GET /health/detailed` - Detailed health check with database status
- `GET /health/ready` - Readiness check for load balancers

### Authentication Endpoints

All auth endpoints are handled by Better Auth at `/api/auth/*`:

- `POST /api/auth/sign-in` - Sign in with email/password
- `POST /api/auth/sign-up` - Sign up with email/password
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session
- `GET /api/auth/callback` - OAuth callback handler

### Protected API Endpoints (Require Authentication)

All `/api/*` endpoints except auth require a valid session:

#### User Management

- `GET /api/user/profile` - Get current user profile
- `PUT /api/user/profile` - Update user profile

#### Data Endpoints

- `GET /api/data` - Get user-specific data
- `POST /api/items` - Create new item
- `GET /api/items` - Get user's items
- `DELETE /api/items/:id` - Delete specific item

#### Admin Endpoints

- `GET /api/admin/users` - Admin-only endpoint (requires admin role)

## 📊 Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {} // Optional additional error details
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid request data
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Server error

## 🔒 Security & CORS

### CORS Configuration

The API is configured to accept requests from:

- `http://localhost:3000` - Development API server
- `http://localhost:8081` - Expo development server
- `http://YOUR_COMPUTER_IP:3000` - Phone testing (replace with your IP)
- `pocket-pixie://` - Mobile app deep links

### Trusted Origins

For authentication, the following origins are trusted:

- `pocket-pixie://` - Mobile app
- `http://localhost:3000` - Development
- `http://localhost:8081` - Expo dev server
- `http://YOUR_COMPUTER_IP:3000` - Phone testing

## 📱 Mobile App Integration

### Development Testing

When testing on a physical device:

1. **Find your computer's IP address:**

   ```bash
   # Windows
   ipconfig

   # macOS/Linux
   ifconfig | grep inet
   # or
   ip addr show
   ```

2. **Update CORS origins:**
   Edit `src/index.ts` and replace `YOUR_COMPUTER_IP` with your actual IP

3. **Update mobile app:**
   Edit `../mobile/lib/auth-client.ts` with your IP

4. **Test connection:**
   From your phone, visit `http://YOUR_IP:3000` to verify connectivity

### Production Deployment

For production:

1. Update CORS origins with your production domain
2. Update trusted origins in the auth configuration
3. Set `BETTER_AUTH_URL` to your production API URL

## 🗄️ Database

### Schema

The database schema is defined in `@pocket-pixie/db` package:

- **Users** - User accounts
- **Sessions** - Authentication sessions
- **Accounts** - OAuth account connections
- **Verification** - Email verification tokens

### Database Commands

The API uses two separate databases:

- **Main Database** (`packages/db/local.db`) - For business logic data
- **Auth Database** (`packages/auth/auth.db`) - For authentication data

```bash
# Generate and migrate all databases
pnpm run db:generate:all
pnpm run db:migrate:all

# Individual database commands
pnpm run db:generate          # Main database types
pnpm run db:migrate           # Main database migrations
pnpm run auth:db:generate     # Auth database types
pnpm run auth:db:migrate      # Auth database migrations

# Reset databases
rm packages/db/local.db packages/auth/auth.db && pnpm run db:migrate:all
```

## 🧪 Testing

```bash
# Run tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage
```

## 🚀 Deployment

### Build Process

```bash
# Build the application
pnpm run build

# The built files will be in ./dist/
```

### Production Server

```bash
# Start production server
pnpm run start

# Or run directly with Bun
bun dist/index.js
```

### Environment Variables for Production

```bash
BETTER_AUTH_SECRET=your-production-secret-here
BETTER_AUTH_URL=https://your-api-domain.com
DATABASE_URL=./production.db
NODE_ENV=production
```

## 📊 Monitoring & Logging

The API includes:

- **Request logging** via Hono logger middleware
- **Error handling** with proper HTTP status codes
- **CORS headers** for cross-origin requests

## 🔧 Configuration

### Server Configuration

- **Port:** 3000 (configurable via command line)
- **Host:** 0.0.0.0 (accessible from network)
- **CORS:** Configured for development and production

### Build Configuration

- **TypeScript:** Strict mode enabled
- **ES Modules:** Modern ES module syntax
- **Source Maps:** Enabled for debugging

## 📚 Related Documentation

- [Root README](../README.md) - Main project documentation
- [Build Process](../../BUILD_PROCESS.md) - Turborepo build pipeline
- [Database Package](../../packages/db/README.md) - Database setup
- [Auth Package](../../packages/auth/README.md) - Authentication
- [Mobile App](../mobile/README.md) - Frontend application

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use:**

   ```bash
   # Kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Database connection errors:**

   ```bash
   # Reset database
   rm ../../packages/db/local.db
   pnpm run db:migrate
   ```

3. **CORS errors:**
   - Check that your mobile app's IP is in the CORS origins
   - Verify the mobile app is using the correct API URL

4. **Module resolution errors:**
   ```bash
   # Reinstall workspace dependencies
   pnpm install
   ```

## 🤝 Contributing

1. Follow the existing code style
2. Add TypeScript types for new endpoints
3. Update this README for API changes
4. Test your changes with the mobile app

## 📄 License

This project is licensed under the MIT License.
