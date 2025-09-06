import { student } from "@/db";
import { eq } from "drizzle-orm";
import {
  StudentResponse,
  StudentCreate,
  StudentUpdate,
  transformStudentForApi,
} from "@/models/student";
import { db as DATABASE } from "@/db";

export class StudentRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0
  ): Promise<StudentResponse[]> {
    const result = await this.db
      .select()
      .from(student)
      .limit(limit)
      .offset(offset);
    return result.map((row) => {
      return transformStudentForApi(row);
    });
  }

  async findById(id: number): Promise<StudentResponse | null> {
    const result = await this.db
      .select()
      .from(student)
      .where(eq(student.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    const row = result[0];
    if (!row) {
      return null;
    }
    return transformStudentForApi(row);
  }

  async findByEmail(email: string): Promise<StudentResponse | null> {
    const result = await this.db
      .select()
      .from(student)
      .where(eq(student.email, email))
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
      createdAt: new Date(row.createdAt).toISOString(),
    };
  }

  async create(data: StudentCreate): Promise<StudentResponse> {
    const result = await this.db.insert(student).values({
      name: data.name,
      email: data.email,
      age: data.age,
    });

    // Get the last inserted ID
    const lastInsertRowId = result.lastInsertRowid;
    if (!lastInsertRowId) {
      throw new Error("Failed to create student");
    }

    const created = await this.findById(Number(lastInsertRowId));
    if (!created) {
      throw new Error("Failed to create student");
    }

    return created;
  }

  async update(
    id: number,
    data: StudentUpdate
  ): Promise<StudentResponse | null> {
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

    await this.db.update(student).set(updateData).where(eq(student.id, id));

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(student).where(eq(student.id, id));

    return result.rowsAffected > 0;
  }

  async count(): Promise<number> {
    const result = await this.db.select({ count: student.id }).from(student);

    return result.length;
  }

  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    const result = await this.db
      .select()
      .from(student)
      .where(eq(student.email, email))
      .limit(1);

    return result.length > 0;
  }
}
