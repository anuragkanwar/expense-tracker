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
db (uses config-typescript)
    ↓
auth (uses db, config-typescript)
    ↓
api (uses auth, db, validators)
mobile (uses auth)
```

## Available Commands

### Development

```bash
# Start all dev servers
pnpm run dev

# Start specific services
pnpm run dev:api          # API server only
pnpm run dev:mobile       # Mobile app only

# Database operations
pnpm run db:generate      # Generate Drizzle schema
pnpm run db:migrate       # Run database migrations
```

### Building

```bash
# Build everything
pnpm run build

# Build specific parts
pnpm run build:packages   # Build all packages
pnpm run build:api        # Build API only
pnpm run build:mobile     # Build mobile app
```

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

- **Purpose**: Database connection and schemas
- **Build**: TypeScript compilation
- **Dependencies**: `config-typescript`
- **Special commands**:
  - `db:generate`: Generate Drizzle types from schema
  - `db:migrate`: Run database migrations
- **Used by**: `auth`, `api`

### 4. **Auth Package**

- **Purpose**: Authentication logic with Better Auth
- **Build**: TypeScript compilation
- **Dependencies**: `db`, `config-typescript`
- **Used by**: `api`, `mobile`

### 5. **API App**

- **Purpose**: Backend server
- **Build**: TypeScript compilation
- **Dependencies**: `auth`, `db`, `validators`
- **Dev server**: `bun --watch --port 3000`

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

### First Time Setup

```bash
# Install all dependencies
pnpm install

# Generate database types
pnpm run db:generate

# Run database migrations
pnpm run db:migrate
```

### Daily Development

```bash
# Start all services
pnpm run dev

# Or start individually
pnpm run dev:api      # Terminal 1
pnpm run dev:mobile   # Terminal 2
```

### Building for Production

```bash
# Build all packages
pnpm run build

# Build mobile app for staging
cd apps/mobile
pnpm run build:staging

# Build mobile app for production
pnpm run build:production
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

### Build Order Issues

Turborepo handles build order automatically, but if you need to force rebuild:

```bash
# Clean all build artifacts
pnpm run clean

# Force rebuild everything
pnpm run build --force
```

### Database Issues

```bash
# Regenerate types after schema changes
pnpm run db:generate

# Reset database
rm packages/db/local.db
pnpm run db:migrate
```

## Performance Tips

1. **Use Turborepo caching**: Avoid rebuilding unchanged packages
2. **Run in parallel**: Turborepo runs independent tasks in parallel
3. **Filter when possible**: Use `--filter` to run only what you need
4. **Clean regularly**: Use `pnpm run clean` to remove stale cache

## Next Steps

- [ ] Set up CI/CD pipeline
- [ ] Configure production deployments
- [ ] Add testing scripts
- [ ] Set up monitoring and logging</content>
      </xai:function_call_1>  
      <xai:function_call name="write">
      <parameter name="filePath">/home/anumax/projects/pocket-pixie/apps/mobile/package.json
