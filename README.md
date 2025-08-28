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
│   │   └── dist/            # Compiled JavaScript output
│   └── mobile/              # React Native/Expo mobile app
├── packages/
│   ├── auth/                # Authentication package (Better Auth)
│   │   ├── src/             # Source TypeScript files
│   │   └── dist/            # Compiled JavaScript output
│   ├── db/                  # Database package (Drizzle ORM + SQLite)
│   │   ├── src/             # Source TypeScript files
│   │   ├── dist/            # Compiled JavaScript output
│   │   └── migrations/      # Database migration files
│   ├── validators/          # Zod validation schemas
│   │   ├── src/             # Source TypeScript files
│   │   └── dist/            # Compiled JavaScript output
│   ├── config-eslint/       # ESLint configuration
│   ├── config-prettier/     # Prettier configuration
│   └── config-typescript/   # TypeScript configuration
├── tools/
│   └── types/               # Shared TypeScript types
└── package.json             # Root package with workspace config
```

## 🏗️ Architecture

### Dependency Flow

```
config-* (no dependencies)
    ↓
validators (Zod schemas)
    ↓
db (Database models & connection)
    ↓
auth (Authentication logic)
    ↓
api (Backend server)
mobile (Frontend app)
```

### Tech Stack

**Backend:**

- **Runtime:** Bun
- **Framework:** Hono
- **Database:** SQLite + Drizzle ORM
- **Auth:** Better Auth
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

## 🗄️ Database Architecture

This monorepo uses **separate databases** for different concerns to ensure security isolation and independent scaling:

### Database Separation

- **`packages/db/local.db`** - Main business logic database
  - User profiles, business data, application-specific tables
- **`packages/auth/auth.db`** - Authentication-specific database
  - Auth sessions, tokens, authentication-related data

### Database Commands

```bash
# Individual databases
pnpm run db:generate          # Generate types for main database
pnpm run db:migrate           # Migrate main database
pnpm run auth:db:generate     # Generate types for auth database
pnpm run auth:db:migrate      # Migrate auth database

# All databases at once
pnpm run db:generate:all      # Generate types for all databases
pnpm run db:migrate:all       # Migrate all databases
```

### Why Separate Databases?

- **Security isolation** between authentication and business data
- **Independent scaling** of auth vs business logic
- **Clean separation** of concerns
- **Easier maintenance** and troubleshooting

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
pnpm run build:packages    # Compiles all packages
# ✅ Source files in src/ remain clean
# ✅ Generated files go to dist/
# ✅ Git status shows only source file changes

# Database workflow
pnpm run db:generate:all   # Generates migrations
pnpm run db:migrate:all    # Applies migrations
# ✅ Migration files are committed
# ✅ Database files are ignored
```

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
pnpm run build:api        # Build API only
pnpm run build:mobile     # Build mobile app

# Code quality
pnpm run lint             # Lint all code
pnpm run lint:fix         # Lint and auto-fix
pnpm run check-types      # Type check all packages
pnpm run format           # Format code with Prettier

# Database
pnpm run db:generate      # Generate Drizzle types (main db)
pnpm run db:migrate       # Run database migrations (main db)
pnpm run auth:db:generate # Generate Drizzle types (auth db)
pnpm run auth:db:migrate  # Run database migrations (auth db)
pnpm run db:generate:all  # Generate all databases
pnpm run db:migrate:all   # Migrate all databases

# Note: Migration files are committed to git, database files are ignored

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

#### **Database Scripts**

- **`db:generate`** → Main business database (`@pocket-pixie/db`)
- **`auth:db:generate`** → Auth database (`@pocket-pixie/auth`)
- **`db:generate:all`** → Both databases simultaneously
- **`db:migrate:all`** → Migrate both databases simultaneously

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

## 🔧 API Server Features

- **REST API:** Hono framework with TypeScript
- **Authentication:** Better Auth integration
- **Database:** SQLite with Drizzle ORM
- **Validation:** Zod schemas
- **CORS:** Configured for development and production
- **Hot Reload:** Bun's watch mode for development

## 🚀 Deployment

### API Deployment

```bash
# Build the API (outputs to apps/api/dist/)
pnpm run build:api

# Start production server
cd apps/api && bun dist/index.js
```

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

### Root `.env`

```bash
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=./packages/db/local.db
AUTH_DATABASE_URL=./packages/auth/auth.db
```

**Note:** Database files (`.db`) are ignored by git. Only migration files in `packages/*/migrations/` are committed.

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

## 🆘 Support

If you encounter any issues:

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
