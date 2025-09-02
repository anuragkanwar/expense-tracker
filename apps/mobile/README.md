# Pocket Pixie Mobile App 📱

A modern React Native mobile application built with Expo, featuring authentication, beautiful UI, and seamless user experience.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev:mobile

# Or start with specific environment
pnpm run start:staging
pnpm run start:production
```

## 📋 Overview

This mobile app provides:

- **Beautiful UI** with NativeWind + TailwindCSS
- **Authentication** integration with Better Auth
- **Multi-environment support** (Dev/Staging/Production)
- **Deep linking** with custom URL scheme
- **Type-safe** development with TypeScript
- **Modern navigation** with Expo Router

## 🏗️ Architecture

### Tech Stack

- **Framework:** React Native + Expo
- **Navigation:** Expo Router (file-based routing)
- **Styling:** NativeWind + TailwindCSS
- **Authentication:** Better Auth React Client
- **State Management:** React hooks + Context
- **Icons:** Lucide React Native
- **Language:** TypeScript

### Key Dependencies

- `better-auth` - Authentication framework
- `@better-auth/expo` - Expo-specific authentication client
- `expo-router` - File-based navigation
- `nativewind` - TailwindCSS for React Native

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (macOS) or Android Emulator/Device

### Environment Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Environment configuration:**
   The app supports multiple environments:
   - `.env` - Development
   - `.env.staging` - Staging
   - `.env.production` - Production

3. **API URL configuration:**
   Update `lib/auth-client.ts` with your API URL:
   ```typescript
   baseURL: "http://localhost:3000", // For development
   // or
   baseURL: "http://YOUR_COMPUTER_IP:3000", // For device testing
   ```

### Development Commands

```bash
# Start development server
pnpm run start

# Start with specific environment
pnpm run start:staging
pnpm run start:production

# Start for device testing
pnpm run dev:mobile

# Build for staging
pnpm run build:staging

# Build for production
pnpm run build:production

# Lint code
pnpm run lint

# Type check
pnpm run check-types

# Clean build artifacts
pnpm run clean
```

## 📱 App Structure

```
mobile/
├── app/                    # Main app screens (Expo Router)
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Home screen
│   └── ...                # Other screens
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components
│   └── ...                # Custom components
├── lib/                    # Utilities and configuration
│   ├── auth-client.ts     # Authentication client
│   ├── theme.ts           # Theme configuration
│   └── utils.ts           # Helper functions
├── constants/              # App constants
├── hooks/                  # Custom React hooks
├── assets/                 # Images, fonts, etc.
└── ...                     # Config files
```

## 🔧 Configuration

### App Configuration

- **Scheme:** `pocket-pixie://` (for deep linking)
- **Orientation:** Portrait
- **Platforms:** iOS, Android, Web

### Environment Variables

```bash
# Development
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_ENV=development

# Staging
EXPO_PUBLIC_API_URL=https://api-staging.pocket-pixie.com
EXPO_PUBLIC_ENV=staging

# Production
EXPO_PUBLIC_API_URL=https://api.pocket-pixie.com
EXPO_PUBLIC_ENV=production
```

## 📱 Device Testing

### Testing on Physical Device

1. **Find your computer's IP:**

   ```bash
   # Windows
   ipconfig

   # macOS/Linux
   ifconfig | grep inet
   ```

2. **Update API URL:**
   Edit `lib/auth-client.ts`:

   ```typescript
   baseURL: "http://YOUR_COMPUTER_IP:3000",
   ```

3. **Update API CORS:**
   Edit `../api/src/index.ts` to allow your IP

4. **Start the app:**

   ```bash
   EXPO_PUBLIC_ENV=device pnpm run dev:mobile
   ```

5. **Scan QR code** with Expo Go app on your phone

### Testing on Simulator/Emulator

```bash
# iOS Simulator
pnpm run dev:mobile
# Press 'i' in terminal

# Android Emulator
pnpm run dev:mobile
# Press 'a' in terminal
```

## 🔒 Authentication

### Features

- **Email/Password authentication**
- **Secure token storage** with Expo SecureStore
- **Session management**
- **Deep link handling** for auth redirects

### Configuration

The auth client is configured in `lib/auth-client.ts`:

- **Base URL:** Points to API server
- **Scheme:** `pocket-pixie` for deep linking
- **Storage:** Expo SecureStore for tokens

## 🎨 UI Components

### Design System

- **TailwindCSS** for styling
- **NativeWind** for React Native compatibility
- **Custom components** in `components/ui/`
- **Icons** from Lucide React Native

### Key Components

- **Button** - Customizable buttons
- **Input** - Form inputs
- **Card** - Content containers
- **Text** - Typography components
- **And many more...**

## 🚀 Deployment

### Build Process

```bash
# Build for staging
pnpm run build:staging

# Build for production
pnpm run build:production
```

### App Store Deployment

1. **Configure app.json:**
   - Update version numbers
   - Set correct bundle identifiers
   - Configure app icons and splash screens

2. **Build and submit:**

   ```bash
   # For iOS
   eas build --platform ios --profile production

   # For Android
   eas build --platform android --profile production
   ```

## 🧪 Testing

```bash
# Run tests (when implemented)
pnpm run test

# Type checking
pnpm run check-types

# Lint checking
pnpm run lint
```

## 📊 Performance

### Optimization Features

- **Code splitting** with Expo Router
- **Image optimization** with Expo Image
- **Bundle analysis** available
- **Fast refresh** in development

## 🔧 Customization

### Adding New Screens

1. Create new file in `app/` directory
2. Use Expo Router conventions
3. Import and use in navigation

### Adding New Components

1. Create component in `components/`
2. Follow existing patterns
3. Use TypeScript for type safety

### Styling

- Use TailwindCSS classes
- Follow design system
- Test on multiple screen sizes

## 📚 Related Documentation

### Project Overview

- [Root README](../../README.md) - Main project documentation and architecture
- [Build Process](../../BUILD_PROCESS.md) - Turborepo build pipeline and commands

### Environment Configuration

- [Environment Setup](./README_ENVIRONMENTS.md) - Detailed environment configuration guide

### Backend Services

- [API Documentation](../api/README.md) - Backend API with clean architecture
- [Database Package](../../packages/db/README.md) - Database and authentication setup

### Development Tools

- [Validators Package](../../packages/validators/README.md) - Data validation schemas
- [ESLint Config](../../packages/config-eslint/README.md) - Code linting rules
- [Prettier Config](../../packages/config-prettier/README.md) - Code formatting
- [TypeScript Config](../../packages/config-typescript/README.md) - TypeScript setup

## 🆘 Troubleshooting

### Common Issues

1. **Metro bundler issues:**

   ```bash
   # Clear Metro cache
   pnpm run clean
   pnpm run dev:mobile
   ```

2. **Authentication problems:**
   - Check API URL in `lib/auth-client.ts`
   - Verify CORS settings in API
   - Check network connectivity

3. **Styling issues:**
   - Restart Metro bundler
   - Check TailwindCSS configuration
   - Verify NativeWind setup

4. **Deep linking not working:**
   - Verify scheme in `app.json`
   - Check URL format
   - Test on physical device

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for all new code
3. Test on both iOS and Android
4. Update documentation for new features
5. Follow Expo and React Native best practices

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using React Native, Expo, and modern mobile technologies.
