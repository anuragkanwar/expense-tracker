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

- **RESTful API** for student management
- **SQLite database** with Drizzle ORM
- **Type-safe** request/response handling
- **Centralized error handling** with custom error classes
- **Global logging** for development and debugging
- **Input validation** with Zod schemas
- **Clean architecture** with middleware system

## 🏗️ Architecture

### Tech Stack

- **Runtime:** Bun
- **Framework:** Hono
- **Database:** SQLite + Drizzle ORM
- **Validation:** Zod
- **Error Handling:** Custom error classes
- **Logging:** Request/response logging
- **Language:** TypeScript

### Dependencies

- `@pocket-pixie/db` - Database schema and types (single source of truth)
- `drizzle-orm` - Type-safe database operations
- `zod` - Runtime type validation and schema creation
- `hono` - Web framework for API routes
- `tsc-alias` - Path alias resolution for builds
- `vite` - Development server and testing configuration

### Architecture Benefits

- **Type Safety**: Database schema generates TypeScript types used throughout the API
- **Single Source of Truth**: Schema changes automatically propagate to models and DTOs
- **Clean Architecture**: Repository-Service-Route pattern with proper separation
- **Middleware System**: Centralized error handling, logging, and validation
- **Custom Error Classes**: Structured error responses with proper HTTP codes
- **Path Aliases**: Clean `@/` imports resolved by tsc-alias
- **Validation**: Zod schemas ensure data integrity at runtime
- **Modern Development**: Hot reload, testing, and clean imports

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
    # Generate TypeScript types and migrations
    pnpm run db:generate

    # Run database migrations
    pnpm run db:migrate
   ```

3. **Environment variables:**
   The API uses environment variables from the root `.env` file:

   ```bash
   DATABASE_URL=./packages/db/local.db
   ```

   **Note:** Authentication environment variables removed for simplicity.

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

## 🔌 API Endpoints (Full CRUD)

### Health & Status

- `GET /` - API health check and status

### Student CRUD Operations

- `GET /students` - Get all students (with pagination support)
- `GET /students/:id` - Get student by ID
- `POST /students` - Create new student
- `PUT /students/:id` - Update existing student
- `DELETE /students/:id` - Delete student

### Request/Response Format

All API responses follow a consistent format:

#### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Data Validation

The API uses Zod schemas for comprehensive input validation:

- **Required fields**: name, email
- **Email format validation**
- **Age range validation** (1-150)
- **String length limits**
- **Email uniqueness checking**

### Architecture

The API follows a clean layered architecture:

#### Folder Structure

```
src/
├── middleware/      # Request/response middleware
│   ├── error-handler.ts    # Centralized error handling
│   ├── logger.ts          # Request logging
│   └── validation.ts      # Input validation helpers
├── errors/          # Custom error classes
│   ├── base-error.ts      # Base error classes
│   └── student-errors.ts  # Student-specific errors
├── models/          # TypeScript interfaces from database schema
├── dtos/            # Zod validation schemas
├── repositories/    # Data access layer
├── services/        # Business logic layer
├── routes/          # HTTP route handlers
├── index.ts         # Main application setup
└── index.test.ts    # API tests
```

#### Layer Responsibilities

- **Middleware**: Request/response processing, error handling, logging, validation
- **Routes**: HTTP request handling and response formatting
- **Services**: Business logic, validation, and error handling
- **Repositories**: Database operations and data transformation
- **Models**: TypeScript interfaces derived from database schema
- **DTOs**: Request/response validation using Zod schemas
- **Errors**: Custom error classes for structured error responses

#### Path Aliases

The API uses path aliases for clean imports:

```typescript
// Clean imports with path aliases
import { StudentService } from "@/services/student-service";
import { createStudentSchema } from "@/dtos/student";
import type { Student } from "@/models/student";

// Resolved to relative paths in production
import { StudentService } from "../services/student-service";
import { createStudentSchema } from "../dtos/student";
```

**✅ Benefits:**

- **Clean Code**: No complex relative paths
- **Maintainable**: Easy to refactor file locations
- **Type-Safe**: Full IntelliSense and auto-completion
- **Build-Safe**: tsc-alias resolves aliases correctly

## 🛡️ Middleware System

The API includes a comprehensive middleware system for request processing, error handling, and logging.

### Error Handler Middleware

Centralized error handling with proper HTTP status codes:

```typescript
// Automatic error handling for all routes
app.use("*", errorHandler());

// Custom errors are automatically formatted
throw new StudentNotFoundError("123");
// Returns: { success: false, error: { code: "NOT_FOUND", message: "..." } }
```

### Logger Middleware

Request/response logging for development:

```typescript
// Automatic logging in development
app.use("*", logger());

// Output:
// [2025-08-29T18:59:11.522Z] GET /students - Start
// [2025-08-29T18:59:11.531Z] GET /students - 200 - 9ms
```

### Validation Middleware

Reusable validation helpers:

```typescript
// Validate request body
app.post("/students", validateBody(createStudentSchema), handler);

// Validate query parameters
app.get("/students", validateQuery(paginationSchema), handler);
```

## 🚨 Error Handling

### Custom Error Classes

Structured error responses with proper HTTP codes:

```typescript
// Base errors
throw new ValidationError("Invalid input", validationErrors);
throw new NotFoundError("Student", "123");
throw new ConflictError("Email already exists");

// Student-specific errors
throw new StudentNotFoundError("123");
throw new StudentEmailConflictError("john@example.com");
```

### Error Response Format

All errors follow a consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Student with identifier '123' not found"
  }
}
```

### Error Types

- `VALIDATION_ERROR` (400) - Invalid input data
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict (e.g., duplicate email)
- `INTERNAL_ERROR` (500) - Server errors

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

- **Students** - Student records with CRUD operations

```typescript
// Student table schema
export const studentTable = sqliteTable("student", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  age: integer("age"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
```

### Database Setup

```bash
# Generate TypeScript types and migrations
pnpm run db:generate

# Run database migrations
pnpm run db:migrate

# Reset database (clean slate)
rm packages/db/local.db && pnpm run db:migrate
```

**✅ Features:**
- SQLite database with Drizzle ORM
- Type-safe database operations
- Automatic migrations
- Clean, minimal schema focused on student management

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
# Build the application with path alias resolution
pnpm run build

# Build process:
# 1. TypeScript compilation (creates .js with @/ aliases)
# 2. tsc-alias resolution (converts @/ to relative paths)
# 3. Final .js files with correct import paths
```

### Production Server

```bash
# Start production server
pnpm run start

# Or run directly with Bun
bun dist/index.js
```

**✅ Build Features:**

- **Path Aliases**: `@/` imports resolved to relative paths
- **Type Safety**: Full TypeScript compilation with strict checks
- **Clean Output**: No build artifacts in source directories
- **Runtime Ready**: All imports work correctly in production

### Environment Variables for Production

```bash
BETTER_AUTH_SECRET=your-production-secret-here
BETTER_AUTH_URL=https://your-api-domain.com
DATABASE_URL=./production.db
NODE_ENV=production
```

## 📊 Monitoring & Logging

The API includes comprehensive monitoring and logging:

### Request Logging

- **Development Mode**: Detailed request/response logging
- **Production Mode**: Minimal logging for performance
- **Performance Tracking**: Request duration and status codes

```bash
# Development logs
[2025-08-29T18:59:11.522Z] GET /students - Start
[2025-08-29T18:59:11.531Z] GET /students - 200 - 9ms

# Production logs (minimal)
[2025-08-29T18:59:11.531Z] GET /students - 200
```

### Error Handling

- **Centralized Error Processing**: All errors handled consistently
- **Structured Error Responses**: Consistent JSON error format
- **Environment-Aware**: Detailed errors in dev, generic in production
- **Custom Error Classes**: Type-safe error handling

### Health Monitoring

- **Health Endpoint**: `/health` for monitoring systems
- **Database Connection**: Automatic health checks
- **Uptime Tracking**: Server uptime information

## 🔧 Configuration

### Server Configuration

- **Port:** 3000 (configurable via command line)
- **Host:** 0.0.0.0 (accessible from network)
- **CORS:** Configured for development and production

### Build Configuration

- **TypeScript:** Strict mode enabled
- **ES Modules:** Modern ES module syntax
- **Source Maps:** Enabled for debugging

## 🚀 Recent Improvements

### v1.0.0 Updates

- **Middleware System**: Centralized error handling, logging, and validation
- **Custom Error Classes**: Structured error responses with proper HTTP codes
- **Enhanced Logging**: Environment-aware request/response logging
- **Clean Architecture**: Improved separation of concerns
- **TypeScript Fixes**: Resolved all type safety issues
- **Production Ready**: Optimized for both development and production

### Key Features

- **Error Handling**: Comprehensive error management with custom classes
- **Request Logging**: Detailed logging in development, minimal in production
- **Input Validation**: Zod-based validation with automatic error formatting
- **Health Monitoring**: Built-in health checks and uptime tracking
- **Clean Code**: Path aliases, proper imports, and maintainable structure

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
