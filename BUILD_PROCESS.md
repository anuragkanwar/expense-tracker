# Build Process & Turborepo Setup

This document explains how the Pocket Pixie monorepo is structured and how to work with it using Turborepo.

## Project Structure

```
pocket-pixie/
├── apps/
│   ├── api/           # Backend API server
│   └── mobile/        # React Native/Expo app
├── packages/
│   ├── auth/          # Authentication package
│   ├── db/            # Database package
│   ├── validators/    # Zod validation schemas
│   ├── config-eslint/ # ESLint configuration
│   ├── config-prettier/ # Prettier configuration
│   └── config-typescript/ # TypeScript configuration
└── package.json       # Root package with turbo scripts
```

## Dependency Graph

```
config-* (no dependencies)
    ↓
validators (uses config-typescript)
    ↓
db (uses config-typescript, drizzle-zod)
    ↓
auth (uses db, config-typescript)
    ↓
api (uses auth, db, validators, auto-generated schemas)
mobile (uses auth)
```

## Architecture Flow

```
🎯 Drizzle Schema (Single Source of Truth)
    ↓
🔄 drizzle-zod (Auto-Generated Schemas)
    ↓
📋 Smart DTOs (Field Control)
    ↓
🛠️ Clean API Routes
    ↓
📚 OpenAPI Documentation
```

config-\* (no dependencies)
↓
validators (uses config-typescript)
↓
db (uses config-typescript, drizzle-zod, auto-generates Zod schemas)
↓
auth (uses db, config-typescript)
↓
api (uses auth, db, validators, smart DTOs)
mobile (uses auth)

```

## Architecture Flow

```

🎯 Drizzle Schema (Single Source of Truth)
↓
🔄 Auto-Generated Zod Schemas
↓
📋 Smart DTOs (Field Control)
↓
🛠️ Clean API Routes
↓
📚 OpenAPI Documentation

````

## Available Commands

### Development

```bash
# Start all dev servers
pnpm run dev

# Start API + Database together (recommended for development)
pnpm run dev:server       # API + Database + Drizzle Studio

# Start specific services
cd apps/api && pnpm run dev    # API server only
cd packages/db && pnpm run dev # Database + Drizzle Studio only

# Database operations
pnpm run db:generate      # Generate database schema from types
pnpm run db:migrate       # Run database migrations

# API-specific commands
cd apps/api
pnpm run test            # Run API tests with path alias support
pnpm run build           # Build with tsc-alias path resolution
pnpm run dev             # Start development server with hot reload
````

### Building

```bash
# Build everything
pnpm run build

# Build specific parts
pnpm run build:packages   # Build all packages
pnpm run build:api        # Build API with tsc-alias path resolution
pnpm run build:mobile     # Build mobile app
```

### Build Features

**✅ API Package Special Features:**

- **TypeScript Compilation**: Standard .ts to .js conversion
- **tsc-alias Integration**: Resolves `@/` path aliases to relative paths
- **Clean Output**: Production-ready JavaScript with correct imports
- **Path Alias Support**: Clean imports in development, resolved paths in production

### Code Quality

```bash
# Lint all packages
pnpm run lint
pnpm run lint:fix         # Lint and auto-fix

# Type checking
pnpm run check-types

# Format code
pnpm run format
```

### Cleanup

```bash
# Clean build artifacts
pnpm run clean

# Deep clean everything
pnpm run clean:all
```

## Build Process Explained

### 1. **Config Packages** (`config-eslint`, `config-prettier`, `config-typescript`)

- **Purpose**: Shared configuration for tools
- **Build**: No build step needed (just config files)
- **Dependencies**: None

### 2. **Validators Package**

- **Purpose**: Zod schemas for data validation
- **Build**: TypeScript compilation
- **Dependencies**: `config-typescript`
- **Used by**: `api`, `db`

### 3. **DB Package**

- **Purpose**: Database connection, schemas, and auto-generated Zod schemas
- **Build**: TypeScript compilation
- **Dependencies**: `config-typescript`, `zod`, `drizzle-zod`
- **Special commands**:
  - `dev`: Start database server + Drizzle Studio concurrently
  - `db:generate`: Generate Drizzle types from schema
  - `db:migrate`: Run database migrations
- **Used by**: `auth`, `api`

### 4. **Auth Package**

- **Purpose**: Authentication logic with Better Auth
- **Build**: TypeScript compilation
- **Dependencies**: `db`, `config-typescript`
- **Used by**: `api`, `mobile`

### 5. **API App**

- **Purpose**: Backend server with auto-generated schemas and smart DTOs
- **Build**: TypeScript compilation
- **Dependencies**: `auth`, `db`, `validators`
- **Dev server**: `bun --watch --port 3000`
- **Features**: Uses auto-generated Zod schemas from Drizzle, smart DTOs for field control, auto-generated OpenAPI docs

### 6. **Mobile App**

- **Purpose**: React Native/Expo frontend
- **Build**: Expo export (different profiles for staging/production)
- **Dependencies**: `auth`
- **Special features**: Environment-based API URLs

## Environment Configuration

### Mobile App Environments

- **Development**: `http://localhost:3000` (simulator) or `http://YOUR_IP:3000` (device)
- **Staging**: `https://api-staging.pocket-pixie.com`
- **Production**: `https://api.pocket-pixie.com`

### API Environments

- **Development**: `http://localhost:3000`
- **Production**: Configure CORS and trusted origins for production domain

## Development Workflow

### First Time Setup (Simplified)

```bash
# Install all dependencies
pnpm install

# Generate database types
pnpm run db:generate

# Run database migrations
pnpm run db:migrate

# 🎉 Zod schemas are auto-generated from Drizzle - no extra steps!
```

### Daily Development

```bash
# Start all services
pnpm run dev

# Start API + Database together (recommended)
pnpm run dev:server   # API + Database + Drizzle Studio

# Or start individually
cd apps/api && pnpm run dev    # API server
cd packages/db && pnpm run dev # Database + Drizzle Studio
```

### Development Features

**✅ API Package:**

- **Hot Reload**: Bun's watch mode for instant updates
- **Path Aliases**: Clean `@/` imports with full IntelliSense
- **Type Safety**: Full TypeScript support with schema validation
- **Testing**: Vitest with path alias resolution
- **Clean Architecture**: Repository-Service-Route pattern
- **Single Source of Truth**: Drizzle schema drives everything
- **Auto-Generated Schemas**: Zod schemas auto-generated from Drizzle using `drizzle-zod`
- **Smart DTOs**: Field-level control over client data
- **Auto OpenAPI Docs**: Scalar UI with full API documentation

### Architecture Benefits

**✅ Clean Separation of Concerns:**

- **Routes**: HTTP handling and response formatting
- **Services**: Business logic and validation
- **Repositories**: Data access and transformation
- **Models**: TypeScript interfaces from database schema
- **DTOs**: Request/response validation schemas

**✅ Type Safety Throughout:**

- Database schema generates TypeScript types
- Models use database-generated types
- DTOs extend schema types with validation
- All layers maintain type consistency

**✅ Developer Experience:**

- Path aliases for clean imports
- Hot reload for instant feedback
- Comprehensive testing setup
- Full IntelliSense support

### Building for Production

```bash
# Build all packages
pnpm run build

# Build API with path alias resolution
pnpm run build:api
# Includes: TypeScript compilation + tsc-alias resolution

# Build mobile app for staging
cd apps/mobile
pnpm run build:staging

# Build mobile app for production
pnpm run build:production
```

### Path Alias Resolution

The API package uses **tsc-alias** for path alias resolution:

```bash
# Build process with alias resolution
pnpm run build:api
# 1. TypeScript: Compiles .ts to .js (with @/ aliases)
# 2. tsc-alias: Resolves @/ to relative paths
# 3. Result: Production-ready .js with correct imports
```

**Example:**

```typescript
// Source: @/services/student-service
import { StudentRepository } from "@/repositories/student-repository";

// After tsc-alias: ../services/student-service
import { StudentRepository } from "../repositories/student-repository";
```

## Turborepo Features Used

### Task Dependencies

- `^build`: Ensures dependencies are built first
- `dependsOn`: Controls execution order

### Caching

- Automatic caching of build outputs
- Cache invalidation based on file changes
- Persistent dev servers with `persistent: true`

### Filtering

- `--filter=api`: Run commands only on API app
- `--filter='./packages/*'`: Run on all packages

### Global Dependencies

- Files that invalidate all caches when changed
- Includes `package.json`, `turbo.json`, etc.

## Troubleshooting

### Import Errors

If you see module resolution errors:

```bash
# Reinstall workspace dependencies
pnpm install

# Clean and reinstall
pnpm run clean:all
pnpm install
```

### API Build Issues (Recently Resolved)

The API package previously had build configuration issues that have been fixed:

- ✅ **RESOLVED**: Removed `"noEmit": true` from API tsconfig.json
- ✅ **RESOLVED**: Added explicit `.js` extensions for NodeNext compatibility
- ✅ **RESOLVED**: Clean build process with no artifacts in source directories
- ✅ **RESOLVED**: Proper TypeScript compilation to `apps/api/dist/`

If you encounter API build issues, the configuration is now correct and should work out of the box.

### Build Order Issues

Turborepo handles build order automatically, but if you need to force rebuild:

```bash
# Clean all build artifacts
pnpm run clean

# Force rebuild everything
pnpm run build --force
```

### Database Issues (Simplified)

```bash
# Regenerate types after schema changes
pnpm run db:generate

# Reset database
rm packages/db/local.db && pnpm run db:migrate
```

## Performance Tips

1. **Use Turborepo caching**: Avoid rebuilding unchanged packages
2. **Run in parallel**: Turborepo runs independent tasks in parallel
3. **Filter when possible**: Use `--filter` to run only what you need
4. **Clean regularly**: Use `pnpm run clean` to remove stale cache

## 📚 Related Documentation

- [Root README](../README.md) - Main project documentation
- [API Documentation](../apps/api/README.md) - Backend API
- [Mobile App](../apps/mobile/README.md) - React Native application
- [Database Package](../packages/db/README.md) - Database setup
- [Auth Package](../packages/auth/README.md) - Authentication
- [Environment Setup](../apps/mobile/README_ENVIRONMENTS.md) - Mobile app environments

## 🤝 Contributing

1. Follow the existing architectural patterns
2. Test changes across all affected packages
3. Update documentation for any process changes
4. Ensure build compatibility across platforms

## 📄 License

This project is licensed under the MIT License.
