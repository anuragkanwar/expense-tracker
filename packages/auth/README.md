# @pocket-pixie/auth 🔐

Authentication package for Pocket Pixie, providing secure user authentication with Better Auth, supporting both web and mobile platforms.

## 📋 Overview

This package provides:

- **Better Auth integration** with custom configuration
- **Database adapter** using Drizzle ORM
- **Expo support** for mobile authentication
- **Session management** and user authentication
- **Type-safe** authentication functions

## 🏗️ Architecture

### Tech Stack

- **Auth Framework:** Better Auth
- **Database:** Drizzle ORM adapter
- **Mobile Support:** Expo client integration
- **Language:** TypeScript

### Dependencies

- `@pocket-pixie/db` - Database connection and user models
- `better-auth` - Core authentication framework
- `@better-auth/expo` - Expo-specific features

## 🚀 Usage

### Basic Setup

```typescript
import { auth } from "@pocket-pixie/auth";

// In your API route handler
export async function POST(request: Request) {
  return auth.handler(request);
}
```

### Client Usage (Mobile/Web)

```typescript
import { authClient } from "@pocket-pixie/auth/client";

// Sign up
await authClient.signUp.email({
  email: "user@example.com",
  password: "password123",
});

// Sign in
await authClient.signIn.email({
  email: "user@example.com",
  password: "password123",
});

// Get session
const session = await authClient.getSession();
```

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0
- Database setup (see @pocket-pixie/db)

### Installation

This package is part of the monorepo workspace. Install from root:

```bash
pnpm install
```

### Development Commands

```bash
# Build the package
pnpm run build

# Type checking
pnpm run check-types

# Linting
pnpm run lint

# Clean build artifacts
pnpm run clean
```

## 🔧 Configuration

### Auth Configuration

The auth instance is configured in `src/index.ts`:

```typescript
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  plugins: [expo()],
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    "pocket-pixie://", // Mobile app
    "http://localhost:3000", // Development
    "http://localhost:8081", // Expo dev server
    "http://YOUR_IP:3000", // Device testing
  ],
});
```

### Environment Variables

Required environment variables (set in root `.env`):

```bash
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
```

## 🔑 Features

### Authentication Methods

- **Email & Password** - Standard email/password authentication
- **Session Management** - Secure session handling
- **Expo Integration** - Mobile app authentication support

### Security Features

- **Password Hashing** - Secure password storage
- **Session Tokens** - Secure session management
- **CORS Protection** - Origin validation
- **CSRF Protection** - Built-in CSRF protection

### Mobile Support

- **Deep Linking** - Custom URL scheme support (`pocket-pixie://`)
- **Secure Storage** - Expo SecureStore integration
- **Redirect Handling** - Post-authentication redirects

## 📱 Mobile Integration

### Expo Client Setup

```typescript
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [
    expoClient({
      scheme: "pocket-pixie",
      storagePrefix: "pocket-pixie",
      storage: SecureStore,
    }),
  ],
});
```

### Deep Linking

The mobile app uses `pocket-pixie://` scheme for:

- Authentication redirects
- Password reset links
- Email verification

## 🗄️ Database Integration

### User Model

The package uses the user model from `@pocket-pixie/db`:

- **Users table** - User accounts
- **Sessions table** - Authentication sessions
- **Accounts table** - OAuth connections
- **Verification table** - Email verification tokens

### Database Schema

```typescript
// User model (from @pocket-pixie/db)
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  emailVerified: integer("email_verified", { mode: "boolean" }),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});
```

## 🔌 API Endpoints

The auth package provides these endpoints (mounted at `/api/auth`):

### Authentication

- `POST /api/auth/sign-in` - Sign in
- `POST /api/auth/sign-up` - Sign up
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get session

### Account Management

- `POST /api/auth/forgot-password` - Reset password
- `POST /api/auth/reset-password` - Set new password
- `POST /api/auth/verify-email` - Verify email

## 🧪 Testing

```bash
# Run tests (when implemented)
pnpm run test

# Run tests in watch mode
pnpm run test:watch
```

## 🚀 Deployment

### Build Process

```bash
# Build for production
pnpm run build

# Output will be in ./dist/
```

### Production Configuration

For production deployment:

1. Update `trustedOrigins` with production domains
2. Set strong `BETTER_AUTH_SECRET`
3. Configure production database URL
4. Update mobile app scheme if needed

## 📚 API Reference

### Auth Instance Methods

```typescript
// Server-side usage
import { auth } from "@pocket-pixie/auth";

// Handle authentication requests
const response = await auth.handler(request);

// Get session from request
const session = await auth.api.getSession({ headers });

// Validate session
const validSession = await auth.api.getSession();
```

### Client Methods

```typescript
// Client-side usage
import { authClient } from "@pocket-pixie/auth/client";

// Authentication
await authClient.signIn.email({ email, password });
await authClient.signUp.email({ email, password });
await authClient.signOut();

// Session management
const session = await authClient.getSession();
const user = session?.data?.user;
```

## 🔧 Customization

### Adding Custom Fields

To add custom user fields:

1. Update the user schema in `@pocket-pixie/db`
2. Regenerate database types
3. Update auth configuration if needed

### Custom Authentication Methods

To add OAuth providers:

```typescript
import { google } from "better-auth/plugins";

export const auth = betterAuth({
  // ... existing config
  plugins: [
    expo(),
    google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
});
```

## 📊 Monitoring

### Logging

The auth package includes:

- Request logging
- Error tracking
- Session activity logs

### Security Events

- Failed login attempts
- Password reset requests
- Account verification events

## 🆘 Troubleshooting

### Common Issues

1. **CORS errors:**
   - Check `trustedOrigins` configuration
   - Verify API URL in mobile app
   - Check CORS settings in API server

2. **Session issues:**
   - Verify `BETTER_AUTH_SECRET` is set
   - Check database connectivity
   - Clear mobile app storage

3. **Deep linking problems:**
   - Verify scheme in mobile app config
   - Check URL format
   - Test on physical device

4. **Database errors:**
   - Ensure migrations are run
   - Check database permissions
   - Verify schema compatibility

## 📚 Related Documentation

### Project Overview

- [Root README](../../../README.md) - Main project documentation and architecture
- [Build Process](../../../BUILD_PROCESS.md) - Turborepo build pipeline

### Applications Using This Package

- [API Documentation](../../apps/api/README.md) - Backend API server
- [Mobile App](../../apps/mobile/README.md) - React Native application
- [Mobile Environments](../../apps/mobile/README_ENVIRONMENTS.md) - Environment configuration

### Related Packages

- [Database Package](../db/README.md) - User data storage
- [Validators Package](../validators/README.md) - Data validation schemas
- [ESLint Config](../config-eslint/README.md) - Code quality rules
- [TypeScript Config](../config-typescript/README.md) - TypeScript configuration

### External Resources

- [Better Auth Docs](https://better-auth.com) - Official Better Auth documentation

## 🤝 Contributing

1. Follow existing TypeScript patterns
2. Add tests for new features
3. Update documentation
4. Test with both API and mobile app

## 📄 License

This project is licensed under the MIT License.
