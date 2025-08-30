// This file demonstrates DTO generation concepts
// In a real application, you might use code generation tools

/**
 * Example of how to derive DTOs from database schema
 * This shows the concept - in practice, you'd generate these from your actual schema
 */

// Example: If we had a database schema, we could derive DTOs like this:
/*
// From database schema:
const dbStudentSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  age: z.number().nullable(),
  createdAt: z.date(),
});

// Create DTO - adds API validation
export const createStudentDtoSchema = dbStudentSchema.omit({
  id: true,
  createdAt: true
}).extend({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  age: z.number().min(1).max(150).nullable(),
});

// Update DTO - partial of create
export const updateStudentDtoSchema = createStudentDtoSchema.partial();

// Response DTO - can exclude/transform fields
export const studentResponseSchema = dbStudentSchema.omit({
  // Exclude sensitive fields if any
}).transform((data) => ({
  // Transform field names if needed
  ...data,
  // e.g., fullName: data.name (rename fields)
}));
*/

/**
 * Best Practice: DTOs should be derived from models but with API-specific concerns
 *
 * 1. Start with model structure
 * 2. Add API validation rules
 * 3. Transform for API consumers
 * 4. Exclude sensitive data
 * 5. Use mappers for complex transformations
 */
