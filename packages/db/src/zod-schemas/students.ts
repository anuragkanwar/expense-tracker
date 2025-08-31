import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { studentTable } from "../schemas/students.js";

// ==========================================
// STUDENT ZOD SCHEMAS (Auto-generated from Drizzle)
// ==========================================

// Base schemas auto-generated from studentTable
export const studentSelectSchema = createSelectSchema(studentTable);
export const studentInsertSchema = createInsertSchema(studentTable);

// Enhanced schemas with API-specific validations
export const studentInsertSchemaWithValidation = createInsertSchema(
  studentTable,
  {
    name: z.string().min(1, "Name is required").max(100, "Name too long"),
    email: z.string().email("Invalid email format"),
    age: z
      .number()
      .min(1, "Age must be positive")
      .max(150, "Age too high")
      .optional(),
  }
);

// For API responses (transforms Date to string for JSON)
export const studentResponseSchema = studentSelectSchema.extend({
  createdAt: z.string(), // Transform Date to ISO string for client
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type StudentSelect = z.infer<typeof studentSelectSchema>;
export type StudentInsert = z.infer<typeof studentInsertSchema>;
export type StudentInsertValidated = z.infer<
  typeof studentInsertSchemaWithValidation
>;
export type StudentResponse = z.infer<typeof studentResponseSchema>;
