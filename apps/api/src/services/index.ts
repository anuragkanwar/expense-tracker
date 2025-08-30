import type {
  Student,
  CreateStudentData,
  UpdateStudentData,
} from "@/models/student";

export interface IStudentService {
  getAllStudents(limit?: number, offset?: number): Promise<Student[]>;
  getStudentById(id: string): Promise<Student | null>;
  createStudent(data: CreateStudentData): Promise<Student>;
  updateStudent(id: string, data: UpdateStudentData): Promise<Student | null>;
  deleteStudent(id: string): Promise<boolean>;
}
