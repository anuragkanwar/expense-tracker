# Environment Configuration

This guide explains how to run your Pocket Pixie mobile app in different environments.

## Environments

### 1. Development (Simulator/Emulator)

- **API URL**: `http://localhost:3000`
- **Usage**: For development on simulator/emulator
- **Command**: `bun run start`

### 2. Development (Physical Device)

- **API URL**: `http://YOUR_COMPUTER_IP:3000`
- **Usage**: For testing on physical device connected to same network
- **Command**: `bun run start:device`
- **Setup**: Replace `YOUR_COMPUTER_IP` in `lib/auth-client.ts` with your computer's IP

### 3. Staging

- **API URL**: `https://api-staging.pocket-pixie.com`
- **Usage**: For staging/testing builds
- **Command**: `bun run start:staging`
- **Build**: `bun run build:staging`

### 4. Production

- **API URL**: `https://api.pocket-pixie.com`
- **Usage**: For production builds
- **Command**: `bun run start:production`
- **Build**: `bun run build:production`

## How It Works

1. **Environment Variables**: Each environment has its own `.env` file
2. **Build Profiles**: Different app configurations for staging/production
3. **Dynamic API URLs**: The app automatically selects the correct API URL based on environment

## Setup Steps

### For Physical Device Testing:

1. Find your computer's IP address:
   - Windows: `ipconfig`
   - macOS/Linux: `ifconfig` or `ip addr show`
2. Update `lib/auth-client.ts` - replace `YOUR_COMPUTER_IP` with your actual IP
3. Update API CORS in `../../api/src/index.ts` - add your IP to allowed origins
4. Run `bun run start:device`

### For Production:

1. Update `.env.production` with your production API URL
2. Update `packages/auth/src/index.ts` with production trusted origins
3. Build with `bun run build:production`

## File Structure

```
mobile/
├── .env                    # Development environment
├── .env.staging           # Staging environment
├── .env.production        # Production environment
├── app.config.js          # Build profile configurations
└── lib/auth-client.ts     # Dynamic API URL selection
```
