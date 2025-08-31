# Pocket Pixie 🧚‍♀️

A modern monorepo for building full-stack mobile applications with **React Native (Expo)** and **TypeScript API server**. Features clean architecture, type safety, and enterprise-grade tooling.

## 🚀 Quick Start

```bash
# Clone and setup
git clone <your-repo-url>
cd pocket-pixie

# Install dependencies
pnpm install

# Setup database
pnpm run db:migrate

# Start development (API + Database)
pnpm run dev:server
```

**Visit:**

- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs
- **Mobile App**: Expo DevTools

## 📁 Project Structure

```
pocket-pixie/
├── apps/
│   ├── api/                 # 🚀 Hono API Server
│   │   ├── src/            # TypeScript source
│   │   ├── dist/           # Compiled JavaScript
│   │   └── package.json
│   └── mobile/             # 📱 React Native App
│       ├── src/            # React Native source
│       └── package.json
├── packages/
│   ├── db/                 # 🗄️ Turso + Drizzle ORM + Better Auth + Auto-Zod
│   │   ├── src/            # Database schemas, auth, auto-generated Zod schemas
│   │   ├── migrations/     # Database migrations
│   │   └── package.json
│   ├── validators/         # ✅ Zod validation schemas
│   ├── config-eslint/      # 🔧 ESLint configuration
│   ├── config-prettier/    # 🎨 Prettier configuration
│   └── config-typescript/  # 📝 TypeScript configuration
└── package.json            # 🏗️ Monorepo root
```

## 🏗️ Architecture

### Tech Stack

| Component          | Technology          | Purpose                      |
| ------------------ | ------------------- | ---------------------------- |
| **Runtime**        | Bun                 | Fast JavaScript runtime      |
| **API Framework**  | Hono                | Lightweight web framework    |
| **Database**       | Turso + Drizzle     | Distributed SQLite ORM       |
| **Mobile**         | React Native + Expo | Cross-platform mobile        |
| **Validation**     | Zod                 | Runtime type validation      |
| **Styling**        | NativeWind          | TailwindCSS for React Native |
| **Monorepo**       | Turborepo + pnpm    | Build orchestration          |
| **Authentication** | Better Auth         | Secure user authentication   |
| **Linting**        | ESLint              | Code quality and consistency |
| **Formatting**     | Prettier            | Code formatting              |
| **TypeScript**     | TypeScript          | Type-safe development        |

### Clean Architecture

```
🎯 Controllers (Routes)
    ↓
🧠 Services (Business Logic)
    ↓
💾 Repositories (Data Access)
    ↓
🗄️ Database (Turso + Drizzle)
    ↓
🔄 Auto-Generated Zod Schemas
    ↓
📋 Smart DTOs (Field Control)
    ↓
📚 OpenAPI Documentation
```

### Package Overview

| Package                             | Purpose          | Key Features                                                                                |
| ----------------------------------- | ---------------- | ------------------------------------------------------------------------------------------- |
| **@pocket-pixie/db**                | Database + Auth  | Turso + Drizzle ORM, Better Auth integration, auto-generated Zod schemas, type-safe queries |
| **@pocket-pixie/validators**        | Data validation  | Zod schemas, type-safe validation, API request validation                                   |
| **@pocket-pixie/eslint-config**     | Code linting     | ESLint rules for TypeScript, React, consistent code style                                   |
| **@pocket-pixie/prettier-config**   | Code formatting  | Prettier configuration, TailwindCSS class sorting                                           |
| **@pocket-pixie/typescript-config** | TypeScript setup | Base, React, and Expo TypeScript configurations                                             |
| **@pocket-pixie/eslint-config**     | Code linting     | ESLint rules for TypeScript, React, consistent code style                                   |
| **@pocket-pixie/prettier-config**   | Code formatting  | Prettier configuration, TailwindCSS class sorting                                           |
| **@pocket-pixie/typescript-config** | TypeScript setup | Base, React, and Expo TypeScript configurations                                             |

**Benefits:**

- ✅ **SOLID Principles** - Interface-based design
- ✅ **Dependency Injection** - Loose coupling with Awilix
- ✅ **Type Safety** - Full TypeScript coverage from database to client
- ✅ **Single Source of Truth** - Drizzle schema drives everything
- ✅ **Auto-Generated Schemas** - Zod schemas auto-generated from Drizzle (drizzle-zod)
- ✅ **Smart DTOs** - Field-level control over client data
- ✅ **Clean Scripts** - Simplified development workflow
- ✅ **Testability** - Easy mocking and testing
- ✅ **Maintainability** - Clear separation of concerns

## 🔧 Development

### Prerequisites

- **Node.js**: ≥18.0.0
- **pnpm**: ≥8.0.0
- **Bun**: ≥1.0.0
- **Expo CLI**: `npm install -g @expo/cli`

### Setup Commands

```bash
# Install all dependencies
pnpm install

# Setup database
pnpm run db:migrate

# Start development servers
pnpm run dev              # Full stack: API + Database + Mobile (recommended)
pnpm run dev:server       # Backend only: API + Database + Drizzle Studio
pnpm run dev:mobile       # Mobile only: React Native app

# Alternative commands
cd apps/api && bun --watch --port 3000 src/index.ts    # API only
cd packages/db && pnpm run dev                         # Database + Drizzle Studio only
cd apps/mobile && pnpm run dev                         # Mobile app only
```

### Build Commands

```bash
# Build everything
pnpm run build

# Serve built applications
pnpm run serve

# Code quality
pnpm run lint            # Lint all code
pnpm run check-types     # Type check
pnpm run format          # Format with Prettier
```

## 📚 API Documentation

### Interactive Documentation

- **URL**: http://localhost:3000/docs
- **Framework**: Scalar API Reference
- **Features**: Try-it-out, examples, schema viewer

### API Endpoints

| Method   | Endpoint        | Description                   |
| -------- | --------------- | ----------------------------- |
| `GET`    | `/`             | API health check              |
| `GET`    | `/health`       | Detailed health status        |
| `GET`    | `/docs`         | Interactive API documentation |
| `GET`    | `/openapi.json` | OpenAPI specification         |
| `GET`    | `/students`     | List students (paginated)     |
| `GET`    | `/students/:id` | Get student by ID             |
| `POST`   | `/students`     | Create new student            |
| `PUT`    | `/students/:id` | Update student                |
| `DELETE` | `/students/:id` | Delete student                |

### Example Usage

```bash
# Create student
curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","age":25}'

# Get all students
curl http://localhost:3000/students

# View documentation
open http://localhost:3000/docs
```

## 🗄️ Database

### Turso + Drizzle ORM

- **Database**: Distributed SQLite via Turso
- **ORM**: Drizzle with full type safety
- **Migrations**: Automatic schema versioning
- **Local/Prod**: Seamless environment switching

### Database Commands

```bash
# Generate types from schema
pnpm run db:generate

# Run migrations
pnpm run db:migrate

# Open database studio
pnpm run db:studio
```

### Environment Setup

```bash
# Local development
TURSO_DATABASE_URL=file:./local.db

# Production
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

## 📱 Mobile App

### Features

- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **Styling**: NativeWind (TailwindCSS)
- **Type Safety**: Full TypeScript
- **Environments**: Dev/Staging/Production

### Development

```bash
# Start mobile app
pnpm run dev:mobile

# For physical device
EXPO_PUBLIC_ENV=device pnpm run dev:mobile
```

## 🚀 Deployment

### API Deployment

```bash
# Build for production
pnpm run build

# Start production server
cd apps/api && bun dist/index.js
```

### Mobile Deployment

```bash
# Build for app stores
cd apps/mobile
pnpm run build:staging     # Staging builds
pnpm run build:production  # Production builds
```

## 📖 Documentation

### Applications

- **[API Server](./apps/api/README.md)** - Backend API with Hono, clean architecture
- **[Mobile App](./apps/mobile/README.md)** - React Native + Expo application
- **[Mobile Environments](./apps/mobile/README_ENVIRONMENTS.md)** - Environment configuration

### Packages

- **[Database (@pocket-pixie/db)](./packages/db/README.md)** - Turso + Drizzle ORM + Better Auth + Auto-Zod setup
- **[Validators (@pocket-pixie/validators)](./packages/validators/README.md)** - Zod validation schemas
- **[ESLint Config](./packages/config-eslint/README.md)** - Code linting rules
- **[Prettier Config](./packages/config-prettier/README.md)** - Code formatting
- **[TypeScript Config](./packages/config-typescript/README.md)** - TypeScript configurations

### Development

- **[Build Process](./BUILD_PROCESS.md)** - Turborepo build pipeline and commands

## 🆘 Troubleshooting

### Common Issues

**API Server Won't Start:**

```bash
# Check Bun installation
bun --version

# Check port availability
lsof -i :3000

# Restart with clean state
pnpm run clean && pnpm install && pnpm run dev:server
```

**Database Connection Issues:**

```bash
# Reset database
rm packages/db/local.db
pnpm run db:migrate

# Check environment variables
echo $TURSO_DATABASE_URL
```

**Build Failures:**

```bash
# Clean and rebuild
pnpm run clean:all
pnpm install
pnpm run build
```

**Mobile App Issues:**

```bash
# Clear Metro cache
cd apps/mobile && pnpm run clean
pnpm run dev:mobile
```

## 🎯 Key Features

### Core Features

- ✅ **Modern Tech Stack**: Bun runtime, Hono API framework, Turso database, React Native + Expo
- ✅ **Full Type Safety**: TypeScript throughout, with generated types from database schemas
- ✅ **Clean Architecture**: SOLID principles with dependency injection and separation of concerns
- ✅ **Authentication**: Secure user authentication with Better Auth, supporting web and mobile
- ✅ **Data Validation**: Runtime type validation with Zod schemas
- ✅ **Developer Experience**: Hot reload, comprehensive tooling, monorepo orchestration

### Production Ready

- ✅ **Scalable Database**: Turso's distributed SQLite with global replication
- ✅ **Interactive API Docs**: Scalar documentation with try-it-out functionality
- ✅ **Multi-Environment**: Seamless switching between dev, staging, and production
- ✅ **Code Quality**: ESLint, Prettier, and TypeScript configurations
- ✅ **Build Optimization**: Turborepo caching and parallel builds
- ✅ **Mobile Deployment**: Expo build profiles for iOS/Android app stores

### Developer Tools

- ✅ **Monorepo Management**: Turborepo + pnpm workspace orchestration
- ✅ **Path Aliases**: Clean imports with `@/` aliases resolved in production
- ✅ **Shared Configurations**: Consistent linting, formatting, and TypeScript across packages
- ✅ **Testing Setup**: Vitest configuration with path alias support
- ✅ **Build Pipeline**: Automated builds with tsc-alias for path resolution

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes with tests
4. Run quality checks: `pnpm run lint && pnpm run check-types`
5. Submit pull request

### Development Guidelines

- Use TypeScript for all new code
- Follow existing architectural patterns
- Write tests for new features
- Update documentation
- Use conventional commits

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using modern web technologies and clean architecture principles.**
