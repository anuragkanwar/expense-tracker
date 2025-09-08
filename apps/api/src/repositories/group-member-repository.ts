import { groupMember } from "@/db";
import { eq, and } from "drizzle-orm";
import {
  GroupMemberResponse,
  GroupMemberCreate,
  GroupMemberUpdate,
} from "@/models/group-member";
import { type DBType, type DBTransactionType } from "@/db";

export class GroupMemberRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<GroupMemberResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(groupMember)
      .limit(limit)
      .offset(offset);
    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as GroupMemberResponse[];
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<GroupMemberResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(groupMember)
      .where(eq(groupMember.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    const row = result[0];
    if (!row) {
      return null;
    }
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as GroupMemberResponse;
  }

  async findByGroupId(
    groupId: number,
    tx?: DBTransactionType
  ): Promise<GroupMemberResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(groupMember)
      .where(eq(groupMember.groupId, groupId));
    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as GroupMemberResponse[];
  }

  async findByUserId(
    userId: number,
    tx?: DBTransactionType
  ): Promise<GroupMemberResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(groupMember)
      .where(eq(groupMember.userId, userId));
    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as GroupMemberResponse[];
  }

  async create(
    data: GroupMemberCreate,
    tx?: DBTransactionType
  ): Promise<GroupMemberResponse> {
    const db = tx ?? this.db;
    const result = await db
      .insert(groupMember)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: groupMember.id });

    if (result.length === 0 || !result[0]) {
      throw new Error("Failed to create group member");
    }

    const created = await this.findById(result[0].id, tx);
    if (!created) {
      throw new Error("Failed to create group member");
    }

    return created;
  }

  async update(
    id: number,
    data: GroupMemberUpdate,
    tx?: DBTransactionType
  ): Promise<GroupMemberResponse | null> {
    const db = tx ?? this.db;
    await db.update(groupMember).set(data).where(eq(groupMember.id, id));

    return this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(groupMember).where(eq(groupMember.id, id));

    return result.rowsAffected > 0;
  }

  async deleteByGroupIdAndUserId(
    groupId: number,
    userId: number,
    tx?: DBTransactionType
  ): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db
      .delete(groupMember)
      .where(
        and(eq(groupMember.groupId, groupId), eq(groupMember.userId, userId))
      );

    return result.rowsAffected > 0;
  }

  async findByGroupIdAndUserId(
    groupId: number,
    userId: number,
    tx?: DBTransactionType
  ): Promise<GroupMemberResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(groupMember)
      .where(
        and(eq(groupMember.groupId, groupId), eq(groupMember.userId, userId))
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as GroupMemberResponse;
  }
}
