import type pg from "pg";
import type { IUserRepository } from "./interfaces.js";
import type { User, CreateUserDto } from "../types/models.js";

interface UserRow {
  id: number;
  email: string;
  full_name: string;
  created_at: Date;
  updated_at: Date | null;
  updated_by: number | null;
}

export class UserRepository implements IUserRepository {
  constructor(private client: pg.PoolClient) {}

  async getAll(): Promise<User[]> {
    const { rows } = await this.client.query<UserRow>(
      "SELECT * FROM v_active_users ORDER BY id",
    );
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      fullName: r.full_name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      updatedBy: r.updated_by,
    }));
  }

  async getById(id: number): Promise<User | null> {
    const { rows } = await this.client.query<UserRow>(
      "SELECT * FROM v_active_users WHERE id = $1",
      [id],
    );
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      email: r.email,
      fullName: r.full_name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      updatedBy: r.updated_by,
    };
  }

  async add(dto: CreateUserDto): Promise<number> {
    const { rows } = await this.client.query<{ p_user_id: number }>(
      "CALL sp_create_user($1, $2, $3, NULL)",
      [dto.email, dto.fullName, dto.role],
    );
    return rows[0]!.p_user_id;
  }

  async update(
    id: number,
    data: { email?: string; fullName?: string; updatedBy: number },
  ): Promise<void> {
    await this.client.query("CALL sp_update_user($1, $2, $3, $4)", [
      id,
      data.email ?? null,
      data.fullName ?? null,
      data.updatedBy,
    ]);
  }

  async remove(id: number, deletedBy: number): Promise<void> {
    await this.client.query("CALL sp_soft_delete_user($1, $2)", [
      id,
      deletedBy,
    ]);
  }

  async restore(id: number): Promise<void> {
    await this.client.query("CALL sp_restore_user($1)", [id]);
  }

  async hasRole(userId: number, roleName: string): Promise<boolean> {
    const { rows } = await this.client.query<{ has_role: boolean }>(
      "SELECT fn_user_has_role($1, $2) AS has_role",
      [userId, roleName],
    );
    return rows[0]!.has_role;
  }

  async getAvgGrade(studentId: number): Promise<number> {
    const { rows } = await this.client.query<{ avg_grade: string }>(
      "SELECT fn_student_avg_grade($1) AS avg_grade",
      [studentId],
    );
    return parseFloat(rows[0]!.avg_grade);
  }
}
