# @pocket-pixie/db 🗄️

Database package for Pocket Pixie, providing SQLite database connection, schema definitions, and Drizzle ORM integration.

## 📋 Overview

This package provides:

- **SQLite database** connection with Drizzle ORM
- **Schema definitions** for students (currently focused on student management)
- **Type-safe** database operations
- **Migration support** with Drizzle Kit
- **Development** and production database configurations
- **Clean architecture** with proper error handling

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
import { studentTable, db } from "@pocket-pixie/db";

// Use in your application
const newStudent = await db.insert(studentTable).values({
  id: "student-123",
  name: "John Doe",
  email: "john@example.com",
  age: 25
});

// Query students
const students = await db.select().from(studentTable);
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

### Students Table

```typescript
export const studentTable = sqliteTable("student", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  age: integer("age"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
```

### TypeScript Types

```typescript
// Generated types from schema
export type Student = typeof studentTable.$inferSelect;
export type NewStudent = typeof studentTable.$inferInsert;

// Example usage
const student: Student = {
  id: "123",
  name: "John Doe",
  email: "john@example.com",
  age: 25,
  createdAt: new Date()
};

const newStudent: NewStudent = {
  id: "456",
  name: "Jane Smith",
  email: "jane@example.com",
  age: 22
  // createdAt will be auto-generated
};
```

## 🔧 Configuration

### Database Connection

```typescript
// src/index.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema.js";

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create SQLite database connection
const dbPath = resolve(__dirname, "../local.db");
const sqlite = new Database(dbPath);

// Create Drizzle database instance
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

## 🚀 Recent Improvements

### v1.0.0 Updates

- **Simplified Schema**: Focused on student management with clean, minimal schema
- **ES Module Support**: Full ES module compatibility with proper path resolution
- **Type Safety**: Enhanced TypeScript types with proper null safety
- **Clean Architecture**: Repository-Service pattern with proper error handling
- **Production Ready**: Optimized for both development and production environments

### Key Features

- **SQLite Database**: Fast, reliable, file-based database
- **Drizzle ORM**: Type-safe database operations
- **Migration Support**: Automated schema migrations
- **Error Handling**: Proper error management and logging
- **Performance**: Optimized queries and connection management

## 📊 Performance

### Optimization Tips

- **Indexes:** Add indexes for frequently queried columns
- **Connection pooling:** Consider for high-traffic applications
- **Query optimization:** Use `select` with specific columns
- **Batch operations:** Use transactions for multiple operations

### Example Optimized Queries

```typescript
// Select specific columns
const students = await db
  .select({
    id: studentTable.id,
    name: studentTable.name,
    email: studentTable.email
  })
  .from(studentTable);

// Use transactions for batch operations
await db.transaction(async (tx) => {
  await tx.insert(studentTable).values(studentData1);
  await tx.insert(studentTable).values(studentData2);
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
  studentTable,
  db,
  // Types
  Student,
  NewStudent,
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
