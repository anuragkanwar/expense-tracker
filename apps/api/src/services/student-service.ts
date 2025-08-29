import { StudentRepository } from "@/repositories/student-repository";
import type {
  Student,
  CreateStudentData,
  UpdateStudentData,
} from "@/models/student";
import { createStudentSchema, updateStudentSchema } from "@/dtos/student";
import {
  StudentNotFoundError,
  StudentEmailConflictError,
} from "@/errors/student-errors";
import { BadRequestError } from "@/errors/base-error";

export class StudentService {
  private repository: StudentRepository;

  constructor() {
    this.repository = new StudentRepository();
  }

  async getAllStudents(
    limit: number = 10,
    offset: number = 0
  ): Promise<Student[]> {
    return this.repository.findAll(limit, offset);
  }

  async getStudentById(id: string): Promise<Student | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid student ID");
    }

    return this.repository.findById(id);
  }

  async createStudent(data: CreateStudentData): Promise<Student> {
    // Validate input data
    const validatedData = createStudentSchema.parse(data);

    // Check if email already exists
    const existingStudent = await this.repository.findByEmail(
      validatedData.email
    );
    if (existingStudent) {
      throw new StudentEmailConflictError(validatedData.email);
    }

    return this.repository.create(validatedData);
  }

  async updateStudent(
    id: string,
    data: UpdateStudentData
  ): Promise<Student | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid student ID");
    }

    // Validate input data
    const validatedData = updateStudentSchema.parse(data);

    // Check if student exists
    const existingStudent = await this.repository.findById(id);
    if (!existingStudent) {
      return null;
    }

    // Check if email is being updated and if it already exists
    if (validatedData.email && validatedData.email !== existingStudent.email) {
      const emailExists = await this.repository.findByEmail(
        validatedData.email
      );
      if (emailExists) {
        throw new StudentEmailConflictError(validatedData.email);
      }
    }

    return this.repository.update(id, validatedData);
  }

  async deleteStudent(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid student ID");
    }

    // Check if student exists
    const existingStudent = await this.repository.findById(id);
    if (!existingStudent) {
      throw new StudentNotFoundError(id);
    }

    return this.repository.delete(id);
  }
}
