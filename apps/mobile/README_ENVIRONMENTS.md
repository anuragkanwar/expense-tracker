# Pocket Pixie Mobile Environments 📱

This guide explains how to configure and run your Pocket Pixie mobile app across different environments (development, staging, production).

## 📋 Overview

The Pocket Pixie mobile app supports multiple environments with different API endpoints and configurations. This allows for seamless development, testing, and production workflows.

## 🌍 Environments

### Development (Simulator/Emulator)

**Configuration:**

- **API URL**: `http://localhost:3000`
- **Environment File**: `.env` (default)
- **Usage**: Local development on iOS Simulator or Android Emulator
- **Command**: `pnpm run start`

**Features:**

- Hot reload enabled
- Local API server connection
- Development logging

### Development (Physical Device)

**Configuration:**

- **API URL**: `http://YOUR_COMPUTER_IP:3000`
- **Environment File**: `.env`
- **Usage**: Testing on physical iOS/Android device
- **Command**: `pnpm run start:device`

**Setup Requirements:**

1. Find your computer's IP address
2. Update `lib/auth-client.ts` with your IP
3. Update API CORS settings
4. Connect device to same network

### Staging

**Configuration:**

- **API URL**: `https://api-staging.pocket-pixie.com`
- **Environment File**: `.env.staging`
- **Usage**: Pre-production testing and QA
- **Command**: `pnpm run start:staging`

**Features:**

- Production-like environment
- Staging API endpoints
- Build testing

### Production

**Configuration:**

- **API URL**: `https://api.pocket-pixie.com`
- **Environment File**: `.env.production`
- **Usage**: Live production application
- **Command**: `pnpm run start:production`

**Features:**

- Optimized builds
- Production API endpoints
- App Store deployment ready
- **Build**: `bun run build:production`

## How It Works

1. **Environment Variables**: Each environment has its own `.env` file
2. **Build Profiles**: Different app configurations for staging/production
3. **Dynamic API URLs**: The app automatically selects the correct API URL based on environment

## 🛠️ Setup Instructions

### Physical Device Testing Setup

1. **Find your computer's IP address:**

   ```bash
   # Windows
   ipconfig

   # macOS/Linux
   ifconfig | grep inet
   # or
   ip addr show
   ```

2. **Update mobile app configuration:**
   Edit `lib/auth-client.ts`:

   ```typescript
   baseURL: "http://YOUR_COMPUTER_IP:3000",
   ```

3. **Update API CORS settings:**
   Edit `../api/src/index.ts` and add your IP to the allowed origins list

4. **Start the development server:**

   ```bash
   pnpm run start:device
   ```

5. **Test the connection:**
   Open `http://YOUR_IP:3000` in your device's browser to verify connectivity

### Production Environment Setup

1. **Configure production environment:**
   Update `.env.production` with your production API URL:

   ```bash
   EXPO_PUBLIC_API_URL=https://api.pocket-pixie.com
   EXPO_PUBLIC_ENV=production
   ```

2. **Update authentication settings:**
   Edit `packages/auth/src/index.ts` with production trusted origins

3. **Build for production:**
   ```bash
   pnpm run build:production
   ```

## 🔧 Environment Variables

### Development (.env)

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_ENV=development
```

### Staging (.env.staging)

```bash
EXPO_PUBLIC_API_URL=https://api-staging.pocket-pixie.com
EXPO_PUBLIC_ENV=staging
```

### Production (.env.production)

```bash
EXPO_PUBLIC_API_URL=https://api.pocket-pixie.com
EXPO_PUBLIC_ENV=production
```

## 🆘 Troubleshooting

### Common Issues

**❌ Can't connect to API from device:**

- Verify your IP address is correct
- Check that device and computer are on same network
- Ensure API server is running on correct port
- Check firewall settings

**❌ CORS errors:**

- Add your device IP to API CORS origins
- Restart the API server after changes
- Verify the IP format (no http:// prefix in CORS)

**❌ Environment not loading:**

- Check that `.env` files exist in correct location
- Verify environment variable names match
- Restart Expo development server

**❌ Build failures:**

- Clean node_modules: `pnpm run clean`
- Reinstall dependencies: `pnpm install`
- Clear Expo cache: `expo r -c`

## 📚 Related Documentation

- [Mobile App README](../README.md) - Main mobile app documentation
- [API Documentation](../api/README.md) - Backend API setup
- [Build Process](../../BUILD_PROCESS.md) - Build pipeline information

## File Structure

```
mobile/
├── .env                    # Development environment
├── .env.staging           # Staging environment
├── .env.production        # Production environment
├── app.config.js          # Build profile configurations
└── lib/auth-client.ts     # Dynamic API URL selection
```
