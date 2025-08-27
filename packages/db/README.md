# @pocket-pixie/db 🗄️

Database package for Pocket Pixie, providing SQLite database connection, schema definitions, and Drizzle ORM integration.

## 📋 Overview

This package provides:

- **SQLite database** connection with Drizzle ORM
- **Schema definitions** for users, sessions, and accounts
- **Type-safe** database operations
- **Migration support** with Drizzle Kit
- **Development** and production database configurations

## 🏗️ Architecture

### Tech Stack

- **Database:** SQLite
- **ORM:** Drizzle ORM
- **Migration Tool:** Drizzle Kit
- **Language:** TypeScript

### Dependencies

- `drizzle-orm` - ORM for type-safe database operations
- `better-sqlite3` - SQLite database driver
- `drizzle-zod` - Schema validation with Zod

## 🚀 Usage

### Basic Setup

```typescript
import { db } from "@pocket-pixie/db";

// Query users
const users = await db.select().from(user);

// Insert new user
await db.insert(user).values({
  email: "user@example.com",
  password: "hashed-password",
});
```

### Schema Usage

```typescript
import { user, session, account } from "@pocket-pixie/db";

// Use in your application
const newUser = await db.insert(user).values({
  id: "user-123",
  email: "user@example.com",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0
- SQLite3

### Installation

This package is part of the monorepo workspace. Install from root:

```bash
pnpm install
```

### Database Setup

1. **Generate types:**

   ```bash
   pnpm run db:generate
   ```

2. **Run migrations:**
   ```bash
   pnpm run db:migrate
   ```

### Development Commands

```bash
# Generate TypeScript types from schema
pnpm run db:generate

# Run database migrations
pnpm run db:migrate

# Build the package
pnpm run build

# Type checking
pnpm run check-types

# Linting
pnpm run lint

# Clean build artifacts
pnpm run clean
```

## 📊 Database Schema

### Users Table

```typescript
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});
```

### Sessions Table

```typescript
export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});
```

### Accounts Table

```typescript
export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});
```

### Verification Table

```typescript
export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});
```

## 🔧 Configuration

### Database Connection

```typescript
// src/index.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

const sqlite = new Database(process.env.DATABASE_URL || "./local.db");
export const db = drizzle(sqlite, { schema });
```

### Environment Variables

```bash
# Development
DATABASE_URL=./local.db

# Production
DATABASE_URL=./production.db
```

## 🔄 Migrations

### Creating Migrations

1. **Modify schema** in `src/schema.ts`
2. **Generate migration:**
   ```bash
   pnpm run db:generate
   ```
3. **Review** generated migration files in `migrations/`
4. **Apply migration:**
   ```bash
   pnpm run db:migrate
   ```

### Migration Files

Migrations are stored in the `migrations/` directory:

```
migrations/
├── 0000_initial.sql
├── 0001_add_user_fields.sql
└── meta.json
```

## 🧪 Testing

### Database Testing

```typescript
import { db } from "@pocket-pixie/db";

// Clean up after tests
afterEach(async () => {
  await db.delete(user);
  await db.delete(session);
});
```

### Test Database

For testing, use a separate database:

```bash
DATABASE_URL=./test.db pnpm run db:migrate
```

## 🚀 Deployment

### Production Setup

1. **Set production database URL:**

   ```bash
   DATABASE_URL=./production.db
   ```

2. **Run migrations:**

   ```bash
   pnpm run db:migrate
   ```

3. **Build the package:**
   ```bash
   pnpm run build
   ```

### Database Backup

```bash
# Backup production database
cp production.db production-backup-$(date +%Y%m%d-%H%M%S).db
```

## 📊 Performance

### Optimization Tips

- **Indexes:** Add indexes for frequently queried columns
- **Connection pooling:** Consider for high-traffic applications
- **Query optimization:** Use `select` with specific columns
- **Batch operations:** Use transactions for multiple operations

### Example Optimized Queries

```typescript
// Select specific columns
const users = await db.select({ id: user.id, email: user.email }).from(user);

// Use transactions
await db.transaction(async (tx) => {
  await tx.insert(user).values(userData);
  await tx.insert(session).values(sessionData);
});
```

## 🔧 Customization

### Adding New Tables

1. **Define schema** in `src/schema.ts`:

   ```typescript
   export const posts = sqliteTable("posts", {
     id: text("id").primaryKey(),
     title: text("title").notNull(),
     content: text("content"),
     userId: text("user_id").references(() => user.id),
   });
   ```

2. **Export schema:**

   ```typescript
   export * from "./posts";
   ```

3. **Generate migration:**
   ```bash
   pnpm run db:generate
   ```

### Custom Types

```typescript
// Add custom column types
import { customType } from "drizzle-orm/sqlite-core";

const jsonType = customType<{ data: any }>({
  dataType() {
    return "text";
  },
  toDriver(value: any): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): any {
    return JSON.parse(value);
  },
});
```

## 📊 Monitoring

### Database Health

```typescript
// Check database connection
const result = await db.execute(sql`SELECT 1`);

// Get table sizes
const tableSizes = await db.execute(sql`
  SELECT name, sql FROM sqlite_master
  WHERE type='table'
`);
```

### Query Logging

Enable query logging in development:

```typescript
export const db = drizzle(sqlite, {
  schema,
  logger: true, // Log all queries
});
```

## 🆘 Troubleshooting

### Common Issues

1. **Migration errors:**

   ```bash
   # Reset database and rerun migrations
   rm local.db
   pnpm run db:generate
   pnpm run db:migrate
   ```

2. **Type errors after schema changes:**

   ```bash
   # Regenerate types
   pnpm run db:generate
   ```

3. **Database locked errors:**
   - Close all database connections
   - Check for long-running transactions
   - Restart the application

4. **Performance issues:**
   - Add indexes to frequently queried columns
   - Use `EXPLAIN QUERY PLAN` to analyze queries
   - Consider query optimization

## 📚 API Reference

### Database Instance

```typescript
import { db } from "@pocket-pixie/db";

// Query builders
db.select().from(table);
db.insert(table).values(data);
db.update(table).set(data).where(condition);
db.delete(table).where(condition);

// Raw SQL execution
db.execute(sql`SELECT * FROM users`);
```

### Schema Exports

```typescript
import {
  user,
  session,
  account,
  verification,
  // Types
  selectUserSchema,
  insertUserSchema,
} from "@pocket-pixie/db";
```

## 📚 Related Documentation

- [Root README](../../README.md) - Main project documentation
- [Auth Package](../auth/README.md) - Authentication using this database
- [API Documentation](../../apps/api/README.md) - API server using this database
- [Drizzle ORM Docs](https://orm.drizzle.team) - Official documentation

## 🤝 Contributing

1. Follow existing schema patterns
2. Add TypeScript types for new tables
3. Update documentation for schema changes
4. Test database operations thoroughly

## 📄 License

This project is licensed under the MIT License.
