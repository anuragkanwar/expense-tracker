// Auth model types derived from Lucia auth instance environment shapes
// These are intentionally duplicated as structural types (no runtime)
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
