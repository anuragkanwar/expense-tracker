import type {
  StudentResponse,
  StudentCreate,
  StudentUpdate,
} from "@/models/student";
import {
  StudentNotFoundError,
  StudentEmailConflictError,
} from "../errors/student-errors";
import { BadRequestError } from "../errors/base-error";
import { StudentRepository } from "@/repositories/student-repository";

export class StudentService {
  private readonly studentRepository;

  constructor({ studentRepository }: { studentRepository: StudentRepository }) {
    this.studentRepository = studentRepository;
  }

  async getAllStudents(
    limit: number = 10,
    offset: number = 0
  ): Promise<StudentResponse[]> {
    return this.studentRepository.findAll(limit, offset);
  }

  async getStudentById(id: string): Promise<StudentResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid student ID");
    }

    return this.studentRepository.findById(id);
  }

  async createStudent(data: StudentCreate): Promise<StudentResponse> {
    // Check if email already exists
    const existingStudent = await this.studentRepository.findByEmail(
      data.email
    );
    if (existingStudent) {
      throw new StudentEmailConflictError(data.email);
    }

    return this.studentRepository.create(data);
  }

  async updateStudent(
    id: string,
    data: StudentUpdate
  ): Promise<StudentResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid student ID");
    }

    // Check if student exists
    const existingStudent = await this.studentRepository.findById(id);
    if (!existingStudent) {
      return null;
    }

    // Check if email is being updated and if it already exists
    if (data.email && data.email !== existingStudent.email) {
      const emailExists = await this.studentRepository.findByEmail(data.email);
      if (emailExists) {
        throw new StudentEmailConflictError(data.email);
      }
    }

    return this.studentRepository.update(id, data);
  }

  async deleteStudent(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid student ID");
    }

    // Check if student exists
    const existingStudent = await this.studentRepository.findById(id);
    if (!existingStudent) {
      throw new StudentNotFoundError(id);
    }

    return this.studentRepository.delete(id);
  }
}
