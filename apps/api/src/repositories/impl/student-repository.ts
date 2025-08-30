import { studentTable } from "@pocket-pixie/db";
import { eq } from "drizzle-orm";
import type {
  Student,
  CreateStudentData,
  UpdateStudentData,
} from "../../models/student";
import type { IStudentRepository } from "../index";

export class StudentRepository implements IStudentRepository {
  constructor(private db: any) {}

  async findAll(limit: number = 10, offset: number = 0): Promise<Student[]> {
    const result = await this.db
      .select()
      .from(studentTable)
      .limit(limit)
      .offset(offset);

    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      age: row.age,
      createdAt: new Date(row.createdAt),
    }));
  }

  async findById(id: string): Promise<Student | null> {
    const result = await (this.db as any)
      .select()
      .from(studentTable)
      .where((eq as any)(studentTable.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      age: row.age,
      createdAt: new Date(row.createdAt),
    };
  }

  async findByEmail(email: string): Promise<Student | null> {
    const result = await (this.db as any)
      .select()
      .from(studentTable)
      .where((eq as any)(studentTable.email, email))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    if (!row) {
      throw new Error("Student not found");
    }

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      age: row.age,
      createdAt: new Date(row.createdAt),
    };
  }

  async create(data: CreateStudentData): Promise<Student> {
    const id = crypto.randomUUID();

    await (this.db as any).insert(studentTable).values({
      id,
      name: data.name,
      email: data.email,
      age: data.age,
    });

    const created = await this.findById(id);
    if (!created) {
      throw new Error("Failed to create student");
    }

    return created;
  }

  async update(id: string, data: UpdateStudentData): Promise<Student | null> {
    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.email !== undefined) {
      updateData.email = data.email;
    }
    if (data.age !== undefined) {
      updateData.age = data.age;
    }

    await (this.db as any)
      .update(studentTable)
      .set(updateData)
      .where((eq as any)(studentTable.id, id));

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await (this.db as any)
      .delete(studentTable)
      .where((eq as any)(studentTable.id, id));

    return result.changes > 0;
  }

  async count(): Promise<number> {
    const result = await (this.db as any)
      .select({ count: studentTable.id })
      .from(studentTable);

    return result.length;
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const result = await (this.db as any)
      .select()
      .from(studentTable)
      .where((eq as any)(studentTable.email, email))
      .limit(1);

    return result.length > 0;
  }
}
