import { Hono } from "hono";
import { logger } from "hono/logger";
import { db, users, selectUserSchema } from "@pocket-pixie/db";
import { UserSchema } from "@pocket-pixie/validators";

const app = new Hono();

app.use("*", logger());

app.get("/", (c) => c.json({ message: "Hello Pocket Pixie!" }));

app.get("/users", async (c) => {
  const allUsers = db.select().from(users).all();
  return c.json(allUsers);
});

app.post("/users", async (c) => {
  const body = await c.req.json();
  const parsed = UserSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid data", issues: parsed.error.issues }, 400);
  }

  try {
    const newUser = db
      .insert(users)
      .values({ email: parsed.data.email })
      .returning()
      .get();

    const safeUser = selectUserSchema.parse(newUser);
    return c.json({ user: safeUser, message: "User created successfully" }, 201);
  } catch (error) {
    return c.json({ error: "User with this email already exists" }, 409);
  }
});

export default app;
