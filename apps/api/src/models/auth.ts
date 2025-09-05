import { auth } from "@pocket-pixie/db";

export type UserAuth = typeof auth.$Infer.Session.user;
export type SessionAuth = typeof auth.$Infer.Session.session;
