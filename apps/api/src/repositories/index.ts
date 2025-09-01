import type {
  StudentResponse,
  StudentCreate,
  StudentUpdate,
} from "@/models/student";

export interface IStudentRepository {
  findAll(limit?: number, offset?: number): Promise<StudentResponse[]>;
  findById(id: string): Promise<StudentResponse | null>;
  findByEmail(email: string): Promise<StudentResponse | null>;
  create(data: StudentCreate): Promise<StudentResponse>;
  update(id: string, data: StudentUpdate): Promise<StudentResponse | null>;
  delete(id: string): Promise<boolean>;
}
