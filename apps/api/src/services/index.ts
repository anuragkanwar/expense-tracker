import type {
  StudentResponse,
  StudentCreate,
  StudentUpdate,
} from "@/models/student";

export interface IStudentService {
  getAllStudents(limit?: number, offset?: number): Promise<StudentResponse[]>;
  getStudentById(id: string): Promise<StudentResponse | null>;
  createStudent(data: StudentCreate): Promise<StudentResponse>;
  updateStudent(
    id: string,
    data: StudentUpdate
  ): Promise<StudentResponse | null>;
  deleteStudent(id: string): Promise<boolean>;
}
