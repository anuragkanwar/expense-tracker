import { z } from "zod";

// Create Student DTO
export const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email format"),
  age: z
    .number()
    .min(1, "Age must be positive")
    .max(150, "Age too high")
    .optional(),
});

export type CreateStudentDto = z.infer<typeof createStudentSchema>;

// Update Student DTO
export const updateStudentSchema = createStudentSchema.partial();

export type UpdateStudentDto = z.infer<typeof updateStudentSchema>;

// Student Response DTO
export const studentResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  age: z.number().optional(),
  createdAt: z.date(),
});

export type StudentResponseDto = z.infer<typeof studentResponseSchema>;

// Student List Response DTO
export const studentListResponseSchema = z.object({
  students: z.array(studentResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type StudentListResponseDto = z.infer<typeof studentListResponseSchema>;
