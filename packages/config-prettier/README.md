# @pocket-pixie/prettier-config 🎨

Shared Prettier configuration for Pocket Pixie monorepo, providing consistent code formatting across all packages and applications.

## 📋 Overview

This package provides:

- **Prettier configuration** for consistent code formatting
- **TailwindCSS integration** for class sorting
- **Monorepo-wide** formatting consistency
- **Editor integration** support

## 🚀 Usage

### Basic Setup

```javascript
// .prettierrc.js
module.exports = {
  ...require("@pocket-pixie/prettier-config"),
  // Your custom overrides
};
```

### With TailwindCSS Plugin

```javascript
// .prettierrc.js
module.exports = {
  ...require("@pocket-pixie/prettier-config"),
  plugins: ["prettier-plugin-tailwindcss"],
};
```

### Configuration File

```json
// .prettierrc
"@pocket-pixie/prettier-config"
```

## 📊 Configuration

### Default Settings

```javascript
{
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  plugins: ['prettier-plugin-tailwindcss']
}
```

### Customization

```javascript
// .prettierrc.js
module.exports = {
  ...require("@pocket-pixie/prettier-config"),
  printWidth: 120, // Override print width
  semi: false, // Override semi-colons
};
```

## 🛠️ Development

### Commands

```bash
# Format code
pnpm run format

# Check formatting
npx prettier --check .

# Fix formatting
npx prettier --write .
```

### Editor Integration

```json
// .vscode/settings.json
{
  "prettier.configPath": "./packages/config-prettier/index.json",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

## 📚 Related Documentation

- [ESLint Config](../config-eslint/README.md) - Linting configuration
- [TypeScript Config](../config-typescript/README.md) - TypeScript configuration
- [Prettier Documentation](https://prettier.io/docs/en/configuration.html)

## 📄 License

This project is licensed under the MIT License.
