import type {
  Student,
  CreateStudentData,
  UpdateStudentData,
} from "@/models/student";

export interface IStudentRepository {
  findAll(limit?: number, offset?: number): Promise<Student[]>;
  findById(id: string): Promise<Student | null>;
  findByEmail(email: string): Promise<Student | null>;
  create(data: CreateStudentData): Promise<Student>;
  update(id: string, data: UpdateStudentData): Promise<Student | null>;
  delete(id: string): Promise<boolean>;
}
