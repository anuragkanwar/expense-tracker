import type { IStudentRepository } from "../../repositories";
import type { IStudentService } from "../index";
import type {
  Student,
  CreateStudentData,
  UpdateStudentData,
} from "../../models/student";
import {
  StudentNotFoundError,
  StudentEmailConflictError,
} from "../../errors/student-errors";
import { BadRequestError } from "../../errors/base-error";

export class StudentService implements IStudentService {
  constructor(private repository: IStudentRepository) {}

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
    // Check if email already exists
    const existingStudent = await this.repository.findByEmail(data.email);
    if (existingStudent) {
      throw new StudentEmailConflictError(data.email);
    }

    return this.repository.create(data);
  }

  async updateStudent(
    id: string,
    data: UpdateStudentData
  ): Promise<Student | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid student ID");
    }

    // Check if student exists
    const existingStudent = await this.repository.findById(id);
    if (!existingStudent) {
      return null;
    }

    // Check if email is being updated and if it already exists
    if (data.email && data.email !== existingStudent.email) {
      const emailExists = await this.repository.findByEmail(data.email);
      if (emailExists) {
        throw new StudentEmailConflictError(data.email);
      }
    }

    return this.repository.update(id, data);
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
