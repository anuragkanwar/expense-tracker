# @pocket-pixie/validators ✅

Validation package for Pocket Pixie, providing Zod schemas for type-safe data validation across the application.

## 📋 Overview

This package provides:

- **Zod schemas** for data validation
- **Type-safe** validation functions
- **Reusable** validation logic
- **API request/response** validation
- **Database** data validation

## 🏗️ Architecture

### Tech Stack

- **Validation Library:** Zod
- **Language:** TypeScript

### Dependencies

- `zod` - Schema validation library

## 🚀 Usage

### Basic Validation

```typescript
import { userSchema } from "@pocket-pixie/validators";

// Validate user data
const result = userSchema.safeParse({
  email: "user@example.com",
  password: "password123",
});

if (result.success) {
  // Data is valid
  console.log(result.data);
} else {
  // Handle validation errors
  console.error(result.error.errors);
}
```

### API Request Validation

```typescript
import { createUserSchema } from "@pocket-pixie/validators";

// In your API route
export async function POST(request: Request) {
  const body = await request.json();

  const validation = createUserSchema.safeParse(body);
  if (!validation.success) {
    return Response.json({ errors: validation.error.errors }, { status: 400 });
  }

  // Use validated data
  const userData = validation.data;
  // ... create user
}
```

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0

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

## 📊 Available Schemas

### User Schemas

```typescript
// User creation
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// User response
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

### Authentication Schemas

```typescript
// Sign in
export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Sign up
export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

### Session Schemas

```typescript
// Session data
export const sessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: z.date(),
});
```

## 🔧 Schema Definitions

### User Validation

```typescript
import { z } from "zod";

// Base user schema
export const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  emailVerified: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Create user schema (without server-generated fields)
export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  emailVerified: true,
});

// Update user schema
export const updateUserSchema = userSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

// User response schema (without sensitive data)
export const userResponseSchema = userSchema.omit({
  password: true,
});
```

### Authentication Validation

```typescript
// Email and password validation
export const emailSchema = z.string().email("Invalid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Sign in schema
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// Sign up schema
export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
```

## 🧪 Testing Validation

### Unit Tests

```typescript
import { createUserSchema } from "@pocket-pixie/validators";

describe("User Validation", () => {
  it("should validate valid user data", () => {
    const validData = {
      email: "user@example.com",
      password: "password123",
    };

    const result = createUserSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const invalidData = {
      email: "invalid-email",
      password: "password123",
    };

    const result = createUserSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error.errors[0].path).toContain("email");
  });
});
```

### Error Handling

```typescript
const result = schema.safeParse(data);

if (!result.success) {
  // Handle validation errors
  const errors = result.error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  return { success: false, errors };
}

return { success: true, data: result.data };
```

## 🚀 Deployment

### Build Process

```bash
# Build for production
pnpm run build

# Output will be in ./dist/
```

### Usage in Production

```typescript
import { createUserSchema } from "@pocket-pixie/validators";

// In production API
export async function createUser(userData: unknown) {
  const validation = createUserSchema.safeParse(userData);

  if (!validation.success) {
    throw new ValidationError(validation.error.errors);
  }

  return await db.insert(user).values(validation.data);
}
```

## 🔧 Customization

### Adding New Schemas

1. **Create schema** in `src/index.ts`:

   ```typescript
   export const productSchema = z.object({
     name: z.string().min(1),
     price: z.number().positive(),
     description: z.string().optional(),
   });
   ```

2. **Export types:**

   ```typescript
   export type Product = z.infer<typeof productSchema>;
   ```

3. **Use in application:**

   ```typescript
   import { productSchema, type Product } from "@pocket-pixie/validators";

   function createProduct(data: unknown): Product {
     return productSchema.parse(data);
   }
   ```

### Custom Validation Rules

```typescript
// Custom password validation
export const strongPasswordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/[0-9]/, "Must contain number")
  .regex(/[^A-Za-z0-9]/, "Must contain special character");

// Custom email domains
export const businessEmailSchema = z
  .string()
  .email()
  .refine((email) => {
    const domain = email.split("@")[1];
    return !["gmail.com", "yahoo.com", "hotmail.com"].includes(domain);
  }, "Business email required");
```

## 📊 Performance

### Optimization Tips

- **Pre-compile schemas** for better performance
- **Use `.safeParse()`** instead of `.parse()` for better error handling
- **Cache compiled schemas** if used frequently
- **Use `.transform()`** for data transformation

### Example Optimizations

```typescript
// Pre-compiled schema for performance
const compiledUserSchema = userSchema.compile();

// Efficient validation
const validateUser = (data: unknown) => {
  return compiledUserSchema.safeParse(data);
};
```

## 🆘 Troubleshooting

### Common Issues

1. **Type errors:**

   ```typescript
   // Fix: Use z.infer for types
   type User = z.infer<typeof userSchema>;
   ```

2. **Validation not working:**
   - Check schema definitions
   - Verify data structure matches schema
   - Use `.safeParse()` for debugging

3. **Performance issues:**
   - Avoid recreating schemas in loops
   - Use compiled schemas for frequent validation
   - Consider using `.strict()` for strict validation

4. **Type inference problems:**
   ```typescript
   // Use proper type annotations
   const result: z.SafeParseReturnType<any, User> = userSchema.safeParse(data);
   ```

## 📚 API Reference

### Schema Methods

```typescript
import { z } from "zod";

// Parse (throws on error)
const data = schema.parse(input);

// Safe parse (returns result object)
const result = schema.safeParse(input);
if (result.success) {
  // Use result.data
} else {
  // Handle result.error.errors
}

// Infer TypeScript type
type MyType = z.infer<typeof mySchema>;
```

### Validation Patterns

```typescript
// Optional fields
z.string().optional();

// Default values
z.string().default("default-value");

// Transformations
z.string().transform((val) => val.toUpperCase());

// Unions
z.union([z.string(), z.number()]);

// Arrays
z.array(z.string());

// Objects
z.object({
  name: z.string(),
  age: z.number(),
});
```

## 📚 Related Documentation

### Project Overview

- [Root README](../../../README.md) - Main project documentation and architecture
- [Build Process](../../../BUILD_PROCESS.md) - Turborepo build pipeline

### Applications Using This Package

- [API Documentation](../../apps/api/README.md) - Backend API server validation
- [Mobile App](../../apps/mobile/README.md) - Frontend data validation
- [Auth Package](../auth/README.md) - Authentication validation

### Related Packages

- [Database Package](../db/README.md) - Database schemas and types
- [ESLint Config](../config-eslint/README.md) - Code quality rules
- [TypeScript Config](../config-typescript/README.md) - TypeScript configuration

### External Resources

- [Zod Documentation](https://zod.dev) - Official Zod validation library docs

## 🤝 Contributing

1. Follow existing schema patterns
2. Add comprehensive validation rules
3. Include TypeScript types
4. Add tests for new schemas
5. Update documentation

## 📄 License

This project is licensed under the MIT License.
