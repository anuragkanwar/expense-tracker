import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { student } from "@pocket-pixie/db";
// ==========================================================
// STUDENT API SCHEMAS (DTOs)
// The single source of truth for the Student API contract.
// ==========================================================

/**
 * ## Student Response Schema
 * Defines the shape of a student object sent to the client.
 * - Based on the database select schema.
 * - Transforms `createdAt` from a Date to an ISO string.
 * - Adds rich OpenAPI metadata for documentation.
 */
export const StudentResponseSchema = createSelectSchema(student, {
  // We can override fields directly here to add metadata
  age: z.number().nullable().openapi({
    example: 25,
  }),
})
  .extend({
    // Modify fields that need type transformation or extra metadata
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the student was created",
    }),
    id: z.number().openapi({
      example: 123,
      description: "Unique student identifier",
    }),
    name: z.string().openapi({
      example: "Jane Doe",
    }),
    email: z.string().email().openapi({
      example: "jane.doe@example.com",
    }),
  })
  .openapi("StudentResponse");

/**
 * ## Student Create Schema
 * Defines the shape for creating a new student.
 * - Based on the database insert schema.
 * - Adds strict validation rules and OpenAPI metadata in one step.
 */
export const StudentCreateSchema = createInsertSchema(student, {
  // COMBINED: Add validation AND OpenAPI metadata in one place
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .openapi({
      example: "John Doe",
      description: "Student's full name",
    }),
  email: z.email("Invalid email format").openapi({
    example: "john.doe@example.com",
    description: "Student's email address",
  }),
  age: z
    .number()
    .min(1, "Age must be positive")
    .max(150, "Age too high")
    .optional()
    .openapi({
      example: 25,
      description: "Student's age in years",
    }),
})
  .omit({
    id: true,
    createdAt: true, // Also a good idea to omit this
  })
  .openapi("StudentCreate");

/**
 * ## Student Update Schema
 * Defines the shape for updating a student. All fields are optional.
 */
export const StudentUpdateSchema =
  StudentCreateSchema.partial().openapi("StudentUpdate");

/**
 * ## Student List Response Schema
 * Defines the shape for paginated student lists.
 */
export const StudentListResponseSchema = z
  .object({
    students: z.array(StudentResponseSchema).openapi({
      description: "Array of student records",
    }),
    total: z.number().openapi({ example: 100 }),
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 10 }),
  })
  .openapi("StudentListResponse");

// ==========================================
// TYPE EXPORTS (Inferred from the schemas)
// ==========================================
export type StudentResponse = z.infer<typeof StudentResponseSchema>;
export type StudentCreate = z.infer<typeof StudentCreateSchema>;
export type StudentUpdate = z.infer<typeof StudentUpdateSchema>;

// ==========================================
// UTILITY FUNCTIONS (Co-located with schemas)
// ==========================================
export function transformStudentForApi(
  _student: typeof student.$inferSelect
): StudentResponse {
  return {
    ..._student,
    id: Number(_student.id), // Convert ID to number
    age: _student.age ?? null, // Ensure age is null if not present
    createdAt: _student.createdAt.toISOString(), // Date → String
  };
}
