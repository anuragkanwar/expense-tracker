import { createAuthClient } from "better-auth/react";
import { reactStartCookies } from "better-auth/react-start";

export const authClient = createAuthClient({
  baseURL: "http://localhost:8000/api/v1/auth",
  plugins: [reactStartCookies()],
});
