import type { Branch, Department, Member, Role, Team, User } from "@prisma/client";

export type MemberRow = Member & {
  user: Pick<User, "id" | "name" | "email" | "image" | "emailVerified">;
  role: Pick<Role, "id" | "name" | "slug">;
  branch: Pick<Branch, "id" | "name"> | null;
  department: Pick<Department, "id" | "name"> | null;
  team: Pick<Team, "id" | "name"> | null;
};

export type RoleOption = Pick<Role, "id" | "name" | "slug" | "isSystem">;
export type BranchOption = Pick<Branch, "id" | "name">;
export type DepartmentOption = Pick<Department, "id" | "name" | "branchId">;
export type TeamOption = Pick<Team, "id" | "name" | "departmentId" | "branchId">;
