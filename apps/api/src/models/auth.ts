import { auth } from "@/db";

export type UserAuth = typeof auth.$Infer.Session.user;
export type SessionAuth = typeof auth.$Infer.Session.session;
