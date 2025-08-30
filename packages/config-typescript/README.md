# @pocket-pixie/typescript-config 📝

Shared TypeScript configuration for Pocket Pixie monorepo, providing consistent TypeScript settings across all packages and applications.

## 📋 Overview

This package provides:

- **TypeScript configurations** for different project types
- **Base config** for Node.js/TypeScript projects
- **React config** for React/React Native projects
- **Expo config** for Expo applications
- **Monorepo-wide** type checking consistency

## 🚀 Usage

### Base Configuration

```json
// tsconfig.json
{
  "extends": "@pocket-pixie/typescript-config/base.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### React Projects

```json
// tsconfig.json
{
  "extends": "@pocket-pixie/typescript-config/react-library.json",
  "include": ["src/**/*", "App.tsx"],
  "exclude": ["node_modules"]
}
```

### Expo Projects

```json
// tsconfig.json
{
  "extends": "@pocket-pixie/typescript-config/expo.json",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

## 📊 Configuration Files

### `base.json` - Node.js/TypeScript

- **Target:** ES2022
- **Module:** ESNext
- **Strict mode:** Enabled
- **Decorators:** Enabled
- **Source maps:** Enabled

### `react-library.json` - React Components

- **Includes base config**
- **JSX:** React
- **React types:** Included
- **Declaration maps:** Enabled

### `expo.json` - Expo Applications

- **Includes React config**
- **Expo types:** Included
- **React Native types:** Included
- **Asset imports:** Enabled

## 🛠️ Development

### Type Checking

```bash
# Check types in current package
pnpm run check-types

# Check types across monorepo
pnpm run check-types
```

### Customization

```json
// tsconfig.json
{
  "extends": "@pocket-pixie/typescript-config/base.json",
  "compilerOptions": {
    "strict": false, // Override strict mode
    "target": "ES2018" // Override target
  }
}
```

## 🔧 Key Settings

### Strict Mode

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

### Module Resolution

```json
{
  "module": "ESNext",
  "moduleResolution": "bundler",
  "allowSyntheticDefaultImports": true,
  "esModuleInterop": true
}
```

### Output

```json
{
  "declaration": true,
  "declarationMap": true,
  "sourceMap": true,
  "outDir": "./dist",
  "rootDir": "./src"
}
```

## 📚 Related Documentation

### Project Overview

- [Root README](../../../README.md) - Main project documentation and architecture
- [Build Process](../../../BUILD_PROCESS.md) - Turborepo build pipeline

### Applications Using This Config

- [API Documentation](../../apps/api/README.md) - Backend API TypeScript setup
- [Mobile App](../../apps/mobile/README.md) - React Native TypeScript setup
- [Database Package](../db/README.md) - Database package TypeScript setup
- [Auth Package](../auth/README.md) - Authentication package TypeScript setup

### Related Configuration Packages

- [ESLint Config](../config-eslint/README.md) - Code linting configuration
- [Prettier Config](../config-prettier/README.md) - Code formatting configuration
- [Validators Package](../validators/README.md) - Data validation schemas

### External Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Official TypeScript documentation

## 📄 License

This project is licensed under the MIT License.
