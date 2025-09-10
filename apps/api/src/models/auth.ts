import { auth } from "@/db";

export type UserAuth = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null | undefined;
  currency: string | null | undefined;
};
export type SessionAuth = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
};

export type ogUserTypeNotUse = typeof auth.$Infer.Session.session;
