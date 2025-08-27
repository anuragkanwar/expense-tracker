# @pocket-pixie/eslint-config 🔧

Shared ESLint configuration for Pocket Pixie monorepo, providing consistent code linting rules across all packages and applications.

## 📋 Overview

This package provides:

- **ESLint configuration** for TypeScript and React projects
- **Base rules** for JavaScript/TypeScript
- **React-specific rules** for React Native and web projects
- **Consistent code style** across the monorepo
- **Integration** with Prettier for code formatting

## 🏗️ Architecture

### Configuration Files

- **`base.mjs`** - Base ESLint rules for JavaScript/TypeScript
- **`react.mjs`** - React-specific rules for React Native/web projects

### Tech Stack

- **Linting:** ESLint
- **Language Support:** JavaScript, TypeScript, JSX, TSX
- **React Support:** React Native, React Web
- **Formatting Integration:** Prettier

## 🚀 Usage

### Basic Setup

```javascript
// eslint.config.mjs
import config from "@pocket-pixie/eslint-config/base.mjs";

export default [
  ...config,
  // Your custom rules
];
```

### React Projects

```javascript
// eslint.config.mjs
import config from "@pocket-pixie/eslint-config/react.mjs";

export default [
  ...config,
  // Your custom rules
];
```

### With Prettier Integration

```javascript
// eslint.config.mjs
import config from "@pocket-pixie/eslint-config/react.mjs";

export default [
  ...config,
  {
    rules: {
      // Your custom rules that don't conflict with Prettier
    },
  },
];
```

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0
- ESLint >= 9.0.0

### Installation

This package is part of the monorepo workspace. Install from root:

```bash
pnpm install
```

### Development Commands

```bash
# Build the package (if needed)
pnpm run build

# Type checking
pnpm run check-types

# Linting
pnpm run lint

# Clean build artifacts
pnpm run clean
```

## 📊 Configuration Details

### Base Configuration (`base.mjs`)

**Core Rules:**

- **TypeScript support** with `@typescript-eslint` parser
- **Import/export validation** with `eslint-plugin-import`
- **Standard JavaScript rules** from `@eslint/js`
- **TypeScript-specific rules** for better type safety

**Key Rules:**

```javascript
{
  // TypeScript
  '@typescript-eslint/no-unused-vars': 'error',
  '@typescript-eslint/explicit-function-return-type': 'warn',
  '@typescript-eslint/no-explicit-any': 'warn',

  // Import/Export
  'import/order': ['error', { 'groups': ['builtin', 'external', 'internal'] }],
  'import/no-unresolved': 'error',

  // General
  'no-console': 'warn',
  'prefer-const': 'error',
  'no-var': 'error',
}
```

### React Configuration (`react.mjs`)

**Includes Base Rules Plus:**

- **React hooks rules** with `eslint-plugin-react-hooks`
- **React-specific rules** with `eslint-plugin-react`
- **JSX accessibility** rules
- **React Native** compatibility

**Key React Rules:**

```javascript
{
  // React Hooks
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',

  // React
  'react/jsx-uses-react': 'off', // Not needed in React 17+
  'react/react-in-jsx-scope': 'off',
  'react/jsx-key': 'error',
  'react/prop-types': 'off', // Using TypeScript

  // JSX
  'jsx-a11y/accessible-emoji': 'warn',
  'jsx-a11y/alt-text': 'warn',
}
```

## 🔧 Customization

### Extending Configurations

```javascript
// eslint.config.mjs
import baseConfig from "@pocket-pixie/eslint-config/base.mjs";
import reactConfig from "@pocket-pixie/eslint-config/react.mjs";

export default [
  ...baseConfig,
  {
    rules: {
      // Add your custom rules
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
];
```

### Project-Specific Rules

```javascript
// For API server
export default [
  ...baseConfig,
  {
    rules: {
      "no-console": "off", // Allow console in server
      "@typescript-eslint/no-var-requires": "off",
    },
  },
];
```

### Ignoring Files

```javascript
// eslint.config.mjs
import config from "@pocket-pixie/eslint-config/react.mjs";

export default [
  ...config,
  {
    ignores: ["dist/**", "node_modules/**", "*.config.js", ".expo/**"],
  },
];
```

## 🧪 Testing Configuration

### Validate Configuration

```bash
# Check if ESLint config is valid
npx eslint --print-config src/index.ts

# Lint specific files
npx eslint src/**/*.ts

# Auto-fix issues
npx eslint src/**/*.ts --fix
```

### Configuration Testing

```javascript
// Test your ESLint config
const { ESLint } = require("eslint");

const eslint = new ESLint({
  overrideConfigFile: "./eslint.config.mjs",
});

const results = await eslint.lintFiles(["src/**/*.ts"]);
console.log(results);
```

## 🚀 Deployment

### Build Process

```bash
# Build configuration files
pnpm run build

# Output will be in ./dist/
```

### Usage in CI/CD

```yaml
# .github/workflows/lint.yml
name: Lint
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
      - run: pnpm install
      - run: pnpm run lint
```

## 📊 Performance

### Optimization Tips

- **Use `.eslintcache`** for faster subsequent runs
- **Configure ignores** to skip unnecessary files
- **Use specific file patterns** instead of broad globs
- **Enable caching** in CI/CD

### Cache Configuration

```javascript
// eslint.config.mjs
export default [
  ...config,
  {
    settings: {
      cache: true,
      cacheLocation: "./.eslintcache",
    },
  },
];
```

## 🆘 Troubleshooting

### Common Issues

1. **Parser errors:**

   ```bash
   # Check TypeScript configuration
   npx tsc --noEmit

   # Verify parser setup
   npx eslint --print-config
   ```

2. **Plugin not found:**

   ```bash
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Conflicting rules:**
   - Check for duplicate rules
   - Use `eslint-config-prettier` to disable conflicting rules
   - Review rule precedence

4. **Performance issues:**

   ```bash
   # Enable caching
   ESLINT_USE_FLAT_CONFIG=true npx eslint src --cache

   # Profile performance
   npx eslint src --format=unix --max-warnings=0 | head -20
   ```

## 📚 Configuration Reference

### Supported File Types

- `.js`, `.jsx` - JavaScript/JSX files
- `.ts`, `.tsx` - TypeScript/TSX files
- `.mjs`, `.cjs` - ES modules/CommonJS

### Environment Support

- **Browser** - Web applications
- **Node.js** - Server-side applications
- **React Native** - Mobile applications
- **ES6+** - Modern JavaScript features

### Integration Points

- **Prettier** - Code formatting (via `eslint-config-prettier`)
- **TypeScript** - Type checking integration
- **React** - React-specific rules
- **Import** - Module import/export validation

## 📚 Related Documentation

- [Root README](../../README.md) - Main project documentation
- [Prettier Config](../config-prettier/README.md) - Code formatting configuration
- [TypeScript Config](../config-typescript/README.md) - TypeScript configuration
- [ESLint Documentation](https://eslint.org/docs/latest/) - Official ESLint docs

## 🤝 Contributing

1. Follow existing configuration patterns
2. Test rules across different file types
3. Update documentation for new rules
4. Consider impact on performance

## 📄 License

This project is licensed under the MIT License.
