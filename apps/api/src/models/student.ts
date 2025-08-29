// Import types from the database schema
import type { Student as DbStudent, NewStudent } from "@pocket-pixie/db";

// Use the database types but convert createdAt to Date for API use
export type Student = Omit<DbStudent, "createdAt"> & { createdAt: Date };
export type CreateStudentData = Omit<NewStudent, "id" | "createdAt">;
export type UpdateStudentData = Partial<CreateStudentData>;
