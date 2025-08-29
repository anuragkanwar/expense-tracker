# Pocket Pixie 🧚‍♀️

A modern monorepo setup for building a full-stack mobile application with React Native (Expo) and a TypeScript API server.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd pocket-pixie

# Install dependencies
pnpm install

# Set up the databases
pnpm run db:generate:all
pnpm run db:migrate:all

# Start development servers
pnpm run dev
```

## 📁 Project Structure

```
pocket-pixie/
├── apps/
│   ├── api/                 # Backend API server (Hono + TypeScript)
│   │   ├── src/             # Source TypeScript files
│   │   ├── dist/            # ✅ Compiled JavaScript output
│   │   └── package.json     # API-specific configuration
│   └── mobile/              # React Native/Expo mobile app
│       ├── src/             # React Native source files
│       └── package.json     # Mobile app configuration
├── packages/
│   ├── auth/                # Authentication package (Better Auth)
│   │   ├── src/             # Source TypeScript files
│   │   ├── dist/            # ✅ Compiled JavaScript output
│   │   └── package.json     # Auth package configuration
│   ├── db/                  # Database package (Drizzle ORM + SQLite)
│   │   ├── src/             # Source TypeScript files
│   │   ├── dist/            # ✅ Compiled JavaScript output
│   │   ├── migrations/      # Database migration files
│   │   └── package.json     # Database package configuration
│   ├── validators/          # Zod validation schemas
│   │   ├── src/             # Source TypeScript files
│   │   ├── dist/            # ✅ Compiled JavaScript output
│   │   └── package.json     # Validators package configuration
│   ├── config-eslint/       # ESLint configuration
│   │   └── package.json     # ESLint config package
│   ├── config-prettier/     # Prettier configuration
│   │   └── package.json     # Prettier config package
│   └── config-typescript/   # TypeScript configuration
│       └── package.json     # TypeScript config package
├── .env                     # Root environment variables
├── package.json             # Root package with workspace config
├── turbo.json               # Turborepo configuration
└── pnpm-workspace.yaml      # pnpm workspace configuration
```

## 🏗️ Architecture

### Dependency Flow

```
config-* (no dependencies)
    ↓
validators (uses config-typescript)
    ↓
db (uses config-typescript) - Student schema (single source of truth)
    ↓
api (uses db, validators) - Full CRUD API with clean architecture
mobile (uses auth) - Full auth integration
```

### Architecture Benefits

- **Single Source of Truth**: Database schema defines all data structures
- **Type Safety**: Generated types ensure consistency across backend and frontend
- **Clean Architecture**: Repository-Service-Route pattern with proper separation
- **Path Aliases**: Clean imports with `@/` aliases resolved by tsc-alias
- **Maintainability**: Changes to schema automatically propagate to all layers
- **Validation**: Zod schemas ensure data integrity at runtime

### API Endpoints (Full CRUD)

#### Health & Status

- `GET /` - API health check and status

#### Student CRUD Operations

- `GET /students` - Get all students (with pagination support)
- `GET /students/:id` - Get student by ID
- `POST /students` - Create new student
- `PUT /students/:id` - Update existing student
- `DELETE /students/:id` - Delete student

#### Request/Response Examples

**Create Student:**

```json
POST /students
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "age": 20
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-generated",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "age": 20,
    "createdAt": "2025-08-29T16:46:00.000Z"
  },
  "message": "Student created successfully"
}
```

### Path Aliases & Clean Imports

The API uses **path aliases** for clean, maintainable imports:

```typescript
// Clean imports with path aliases
import { StudentService } from "@/services/student-service";
import { createStudentSchema } from "@/dtos/student";
import type { Student } from "@/models/student";

// Resolved to relative paths in compiled JavaScript
import { StudentService } from "../services/student-service";
import { createStudentSchema } from "../dtos/student";
```

**✅ Benefits:**

- **Clean Code**: No `../../../` in imports
- **Maintainable**: Easy to refactor and move files
- **Type-Safe**: Full IntelliSense support
- **Build-Safe**: tsc-alias resolves aliases to correct paths

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-generated",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "age": 20,
    "createdAt": "2025-08-29T16:46:00.000Z"
  }
}
```

api (Backend server)
mobile (Frontend app)

````

### Tech Stack

**Backend (Simplified):**

- **Runtime:** Bun
- **Framework:** Hono
- **Database:** SQLite + Drizzle ORM (Student schema only)
- **Validation:** Zod
- **Language:** TypeScript

**Frontend:**

- **Framework:** React Native + Expo
- **Navigation:** Expo Router
- **Styling:** NativeWind (TailwindCSS)
- **Auth Client:** Better Auth React Client
- **Language:** TypeScript

**Development Tools:**

- **Monorepo:** Turborepo
- **Package Manager:** pnpm
- **Linting:** ESLint
- **Formatting:** Prettier
- **Type Checking:** TypeScript

## ✅ Build Status

**All packages are building successfully!** 🎉

- ✅ **packages/auth/dist/** - Authentication package compiled
- ✅ **packages/db/dist/** - Database package compiled
- ✅ **packages/validators/dist/** - Validators package compiled
- ✅ **apps/api/dist/** - API server compiled (recently fixed)

### Recent Fixes

- **API Build Issue Fixed**: Removed `"noEmit": true` from API tsconfig.json
- **Import Extensions**: Added explicit `.js` extensions for NodeNext compatibility
- **Build Configuration**: Updated TypeScript config for proper compilation
- **Package Cleanup**: Removed unnecessary root index.ts and compiled eslint config files
- **Clean Architecture**: API package now builds cleanly to `apps/api/dist/` without artifacts in source

## 🗄️ Database Architecture

This monorepo uses **separate databases** for different concerns to ensure security isolation and independent scaling:

### Database Setup (Simplified)

- **`packages/db/local.db`** - Main database
  - Student records (id, name, email, age)
- **No auth database** - Authentication removed for simplicity

### Database Commands (Simplified)

```bash
# Main database only
pnpm run db:generate          # Generate types for student database
pnpm run db:migrate           # Migrate student database

# Note: Auth database removed for simplicity
````

### Simplified Database Setup

- **Single database** with student schema only
- **Easy to understand** and modify
- **Perfect for testing** the basic setup
- **Add authentication database later** when needed

## 🔨 Build Process & File Organization

This monorepo uses a **clean build architecture** that separates source files from generated artifacts:

### Source vs Generated Files

- **`src/` directories** contain only **TypeScript source files** (`.ts`, `.tsx`)
- **`dist/` directories** contain **compiled JavaScript output** (`.js`, `.d.ts`, `.d.ts.map`)
- **Generated files are ignored by git** - only source files are tracked
- **Migration files are committed** to version control for schema versioning

### Build Configuration

```json
// TypeScript configuration (packages/*/tsconfig.json)
{
  "compilerOptions": {
    "outDir": "./dist", // Output directory for generated files
    "rootDir": "./src", // Source directory
    "declaration": true, // Generate .d.ts files
    "declarationMap": true // Generate .d.ts.map files
  }
}
```

### Git Ignore Strategy

```gitignore
# Build outputs (ignored)
dist/
*.tsbuildinfo

# Generated files in src/ (ignored)
src/*.js
src/*.d.ts
src/*.d.ts.map

# Database files (ignored)
*.db
*.sqlite
*.sqlite3

# Migration files (tracked)
!packages/*/migrations/*.sql
```

### Build Workflow

```bash
# Development workflow
pnpm run build             # ✅ Compiles ALL packages and apps
pnpm run build:packages    # ✅ Compiles only packages (auth, db, validators)
pnpm run build:api         # ✅ Compiles API app to dist/
# ✅ Source files in src/ remain clean
# ✅ Generated files go to dist/
# ✅ Git status shows only source file changes

# Database workflow
pnpm run db:generate:all   # Generates migrations
pnpm run db:migrate:all    # Applies migrations
# ✅ Migration files are committed
# ✅ Database files are ignored
```

### Build Output Verification

After running builds, verify outputs exist:

```bash
# Check package builds
ls packages/*/dist/
# Should show: auth/db/validators dist folders

# Check API build (with tsc-alias)
ls apps/api/dist/
# Should show: compiled JS files with resolved path aliases

# Check build success
pnpm run build:api && echo "✅ API build successful!"
```

### tsc-alias Integration

The API package uses **tsc-alias** to resolve path aliases in compiled JavaScript:

```bash
# Build process with path alias resolution
pnpm run build:api
# 1. TypeScript compilation (creates .js with @/ aliases)
# 2. tsc-alias resolution (converts @/ to relative paths)
# 3. Final .js files with correct import paths
```

**✅ Result:**

- **Development**: Clean `@/` imports in TypeScript
- **Build**: Automatic alias resolution to relative paths
- **Runtime**: Correct import paths in production JavaScript

### Benefits

- **Clean repository** - No generated files mixed with source code
- **Fast development** - Only source files tracked by git
- **Reliable builds** - Generated files can be recreated from source
- **Team collaboration** - Clear separation between source and build artifacts

### Prerequisites

- **Node.js:** >= 18.0.0
- **pnpm:** >= 8.0.0
- **Bun:** >= 1.0.0 (for API development)
- **Expo CLI:** `npm install -g @expo/cli`

### Environment Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up databases:**

   ```bash
   # Generate TypeScript types and migrations for all databases
   pnpm run db:generate:all

   # Run database migrations for all databases
   pnpm run db:migrate:all
   ```

3. **Configure environment variables:**
   ```bash
   # Copy and modify environment files
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Development Commands

```bash
# Start all development servers
pnpm run dev

# Start individual services
pnpm run dev:api          # API server only (http://localhost:3000)
pnpm run dev:mobile       # Mobile app only

# Build commands
pnpm run build            # Build all packages
pnpm run build:packages   # Build packages only (outputs to dist/)
pnpm run build:api        # Build API with tsc-alias path resolution
pnpm run build:mobile     # Build mobile app

# Code quality
pnpm run lint             # Lint all code
pnpm run lint:fix         # Lint and auto-fix
pnpm run check-types      # Type check all packages
pnpm run format           # Format code with Prettier

# Database (Simplified)
pnpm run db:generate      # Generate Drizzle types (student db)
pnpm run db:migrate       # Run database migrations (student db)

# Note: Migration files are committed to git, database files are ignored
# Auth database removed for simplicity

# Cleanup
pnpm run clean            # Clean build artifacts (dist/, *.tsbuildinfo)
pnpm run clean:all        # Deep clean everything (dist/, node_modules cache)
```

### Script Organization

This monorepo uses **Turbo** for task orchestration with intelligent caching and parallelization:

#### **Command Patterns**

- **`pnpm run <command>`** - Runs on all applicable workspaces
- **`pnpm run <command>:<target>`** - Runs on specific workspace (e.g., `dev:api`, `build:mobile`)
- **`pnpm run <package>:<command>`** - Runs package-specific commands (e.g., `auth:db:generate`)

#### **Workspace Targeting**

- **`build`** → All workspaces (respects ^build dependencies)
- **`build:api`** → API workspace only
- **`build:mobile`** → Mobile workspace only
- **`build:packages`** → All packages
- **`dev`** → All workspaces with persistent servers
- **`dev:api`** → API workspace only
- **`dev:mobile`** → Mobile workspace only

#### **Database Scripts (Simplified)**

- **`db:generate`** → Student database (`@pocket-pixie/db`)
- **`db:migrate`** → Migrate student database
- **Note:** Auth database scripts removed for simplicity

### Mobile App Development

The mobile app supports multiple environments:

```bash
# Development (simulator/emulator)
pnpm run dev:mobile

# Development (physical device) - requires IP configuration
EXPO_PUBLIC_ENV=device pnpm run dev:mobile

# Staging environment
cd apps/mobile && pnpm run start:staging

# Production environment
cd apps/mobile && pnpm run start:production
```

**For physical device testing:**

1. Find your computer's IP address
2. Update `apps/mobile/lib/auth-client.ts` with your IP
3. Update API CORS settings in `apps/api/src/index.ts`
4. Run `EXPO_PUBLIC_ENV=device pnpm run dev:mobile`

## 📱 Mobile App Features

- **Authentication:** Email/password with Better Auth
- **Deep Linking:** Custom URL scheme (`pocket-pixie://`)
- **Environment Support:** Dev/Staging/Production configurations
- **Modern UI:** NativeWind + TailwindCSS
- **Type Safety:** Full TypeScript coverage

## 🔧 API Server Features (Simplified)

- **REST API:** Hono framework with TypeScript
- **Database:** SQLite with Drizzle ORM (Student schema)
- **Validation:** Zod schemas
- **Hot Reload:** Bun's watch mode for development
- **Basic Endpoints:** Health check and student data

**Note:** Authentication and CORS middleware removed for simplicity.

## 🚀 Deployment

### API Deployment (Simplified)

```bash
# Build the API (outputs to apps/api/dist/)
pnpm run build:api

# Start production server
cd apps/api && bun dist/index.js
```

**Note:** Simplified deployment without authentication setup.

### Mobile App Deployment

```bash
# Build for staging
cd apps/mobile && pnpm run build:staging

# Build for production
cd apps/mobile && pnpm run build:production
```

## 📚 Documentation

- [Build Process](./BUILD_PROCESS.md) - Detailed build pipeline documentation
- [Mobile Environments](./apps/mobile/README_ENVIRONMENTS.md) - Mobile app environment setup
- [API Documentation](./apps/api/README.md) - API server documentation
- [Database Guide](./packages/db/README.md) - Database setup and usage
- [Authentication](./packages/auth/README.md) - Auth package documentation

## 🔒 Environment Variables

### Root `.env` (Simplified)

```bash
DATABASE_URL=./packages/db/local.db
```

**Note:** Authentication environment variables removed for simplicity. Database files (`.db`) are ignored by git. Only migration files in `packages/*/migrations/` are committed.

### Mobile App Environments

- `.env` - Development
- `.env.staging` - Staging
- `.env.production` - Production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Development Guidelines

- Follow the existing code style
- Use TypeScript for all new code
- Write tests for new features
- Update documentation as needed
- Use conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### Build Issues

**API Build Fails:**

```bash
# If API build fails, check:
pnpm run build:api  # Test API build specifically
ls apps/api/dist/   # Verify dist folder exists
```

**Package Build Issues:**

```bash
# Clean and rebuild
pnpm run clean:all
pnpm install
pnpm run build
```

**Import Extension Errors:**

- ✅ **RESOLVED**: API package now uses explicit `.js` extensions
- ✅ **RESOLVED**: TypeScript config updated for NodeNext compatibility
- ✅ **RESOLVED**: Clean build process with no artifacts in source directories

### Common Issues

1. **Database connection errors:**

   ```bash
   pnpm run db:migrate:all  # Reset databases
   ```

2. **TypeScript compilation errors:**

   ```bash
   pnpm run check-types     # Check for type errors
   pnpm run build:api       # Rebuild API specifically
   ```

3. **Metro bundler issues (mobile):**
   ```bash
   cd apps/mobile && pnpm run clean
   pnpm run start
   ```

### Getting Help

1. Check the [BUILD_PROCESS.md](./BUILD_PROCESS.md) for common solutions
2. Review individual package READMEs
3. Check the Turborepo documentation
4. Open an issue with detailed information

## 🎯 Roadmap

- [ ] Add testing framework (Vitest + React Native Testing Library)
- [ ] Set up CI/CD pipeline
- [ ] Add monitoring and logging
- [ ] Implement push notifications
- [ ] Add offline support
- [ ] Performance optimizations

---

Built with ❤️ using Turborepo, React Native, and modern web technologies.
