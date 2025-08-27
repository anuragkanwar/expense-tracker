# Pocket Pixie 🧚‍♀️

A modern monorepo setup for building a full-stack mobile application with React Native (Expo) and a TypeScript API server.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd pocket-pixie

# Install dependencies
pnpm install

# Set up the database
pnpm run db:generate
pnpm run db:migrate

# Start development servers
pnpm run dev
```

## 📁 Project Structure

```
pocket-pixie/
├── apps/
│   ├── api/                 # Backend API server (Hono + TypeScript)
│   └── mobile/              # React Native/Expo mobile app
├── packages/
│   ├── auth/                # Authentication package (Better Auth)
│   ├── db/                  # Database package (Drizzle ORM + SQLite)
│   ├── validators/          # Zod validation schemas
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

## 🛠️ Development

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

2. **Set up database:**

   ```bash
   # Generate TypeScript types from database schema
   pnpm run db:generate

   # Run database migrations
   pnpm run db:migrate
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
pnpm run build:packages   # Build packages only
pnpm run build:api        # Build API only
pnpm run build:mobile     # Build mobile app

# Code quality
pnpm run lint             # Lint all code
pnpm run lint:fix         # Lint and auto-fix
pnpm run check-types      # Type check all packages
pnpm run format           # Format code with Prettier

# Database
pnpm run db:generate      # Generate Drizzle types
pnpm run db:migrate       # Run database migrations

# Cleanup
pnpm run clean            # Clean build artifacts
pnpm run clean:all        # Deep clean everything
```

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
# Build the API
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
DATABASE_URL=./local.db
```

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
