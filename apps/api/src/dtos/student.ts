import { z } from "@hono/zod-openapi";
import {
  studentInsertSchemaWithValidation,
  studentResponseSchema,
} from "@pocket-pixie/db";

// ==========================================
// AUTO-GENERATED DTOs FROM DRIZZLE SCHEMA
// ==========================================

// Input DTOs - Built on auto-generated Drizzle schemas
export const createStudentDto = studentInsertSchemaWithValidation
  .extend({
    name: z.string().openapi({
      example: "John Doe",
      description: "Student's full name",
    }),
    email: z.string().openapi({
      example: "john.doe@example.com",
      description: "Student's email address",
    }),
    age: z.number().optional().openapi({
      example: 25,
      description: "Student's age in years",
    }),
  })
  .openapi("CreateStudentDto");

export type CreateStudentDto = z.infer<typeof createStudentDto>;

// Update DTO - Partial of create schema for updates
export const updateStudentDto = createStudentDto
  .partial()
  .openapi("UpdateStudentDto");

export type UpdateStudentDto = z.infer<typeof updateStudentDto>;

// ==========================================
// OUTPUT DTOs - API Response Format
// ==========================================

// Student Response DTO - Based on auto-generated schema with OpenAPI metadata
export const studentResponseDto = studentResponseSchema
  .extend({
    id: z.string().openapi({
      example: "550e8400-e29b-41d4-a716-446655440000",
      description: "Unique student identifier",
    }),
    name: z.string().openapi({
      example: "John Doe",
      description: "Student's full name",
    }),
    email: z.string().openapi({
      example: "john.doe@example.com",
      description: "Student's email address",
    }),
    age: z.number().nullable().openapi({
      example: 25,
      description: "Student's age in years",
    }),
    createdAt: z.string().openapi({
      example: "2024-01-30T12:00:00.000Z",
      description: "When the student was created",
    }),
  })
  .openapi("StudentResponseDto");

export type StudentResponseDto = z.infer<typeof studentResponseDto>;

// Student List Response DTO - For paginated endpoints
export const studentListResponseDto = z
  .object({
    students: z.array(studentResponseDto).openapi({
      description: "Array of student records",
    }),
    total: z.number().openapi({
      example: 100,
      description: "Total number of students in database",
    }),
    page: z.number().openapi({
      example: 1,
      description: "Current page number",
    }),
    limit: z.number().openapi({
      example: 10,
      description: "Number of students per page",
    }),
  })
  .openapi("StudentListResponseDto");

export type StudentListResponseDto = z.infer<typeof studentListResponseDto>;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Transform database Student to API response format
export function transformStudentForApi(student: any): StudentResponseDto {
  return {
    ...student,
    createdAt: student.createdAt.toISOString(), // Date → String
  };
}

// Transform array of students for API response
export function transformStudentsForApi(students: any[]): StudentResponseDto[] {
  return students.map(transformStudentForApi);
}
