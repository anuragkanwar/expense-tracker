import { Hono } from "hono";
import { auth } from "@pocket-pixie/auth";
import type { Context } from "hono";

const app = new Hono();

/**
 * Protected API routes
 * All routes here require authentication
 */

// Authentication middleware for protected routes
const requireAuth = async (c: Context, next: () => Promise<void>) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        401
      );
    }

    // Add user to context for use in route handlers
    (c as any).set("user", session.user);
    (c as any).set("session", session);

    await next();
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: "AUTH_ERROR",
          message: "Authentication failed",
        },
      },
      401
    );
  }
};

/**
 * User profile endpoints
 */

// Get current user profile
app.get("/user/profile", requireAuth, async (c) => {
  const user = (c as any).get("user");

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  });
});

// Update user profile
app.put("/user/profile", requireAuth, async (c) => {
  const user = (c as any).get("user");
  const body = await c.req.json();

  // Here you would update the user in the database
  // For now, just return success
  return c.json({
    success: true,
    data: {
      message: "Profile updated successfully",
      user: {
        id: user.id,
        email: body.email || user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: new Date().toISOString(),
      },
    },
  });
});

/**
 * Example data endpoints
 * Replace these with your actual business logic
 */

// Get user data
app.get("/data", requireAuth, async (c) => {
  const user = (c as any).get("user");

  return c.json({
    success: true,
    data: {
      message: `Hello ${user.email}!`,
      timestamp: new Date().toISOString(),
      // Add your actual data here
    },
  });
});

// Create new item
app.post("/items", requireAuth, async (c) => {
  const user = (c as any).get("user");
  const body = await c.req.json();

  // Validate request body
  if (!body.name || typeof body.name !== "string") {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Item name is required",
        },
      },
      400
    );
  }

  // Here you would save to database
  const newItem = {
    id: crypto.randomUUID(),
    name: body.name,
    description: body.description || "",
    userId: user.id,
    createdAt: new Date().toISOString(),
  };

  return c.json(
    {
      success: true,
      data: {
        item: newItem,
        message: "Item created successfully",
      },
    },
    201
  );
});

// Get user's items
app.get("/items", requireAuth, async (c) => {
  const user = (c as any).get("user");

  // Here you would fetch from database
  const items = [
    // Mock data - replace with actual database query
    {
      id: "1",
      name: "Sample Item",
      description: "This is a sample item",
      userId: user.id,
      createdAt: new Date().toISOString(),
    },
  ];

  return c.json({
    success: true,
    data: {
      items,
      count: items.length,
    },
  });
});

// Delete item
app.delete("/items/:id", requireAuth, async (c) => {
  const user = (c as any).get("user");
  const itemId = c.req.param("id");

  // Here you would check ownership and delete from database
  // For now, just return success
  return c.json({
    success: true,
    data: {
      message: `Item ${itemId} deleted successfully`,
    },
  });
});

/**
 * Admin endpoints (example)
 * These would require additional role-based authorization
 */
app.get("/admin/users", requireAuth, async (c) => {
  const user = (c as any).get("user");

  // Check if user is admin (you would implement this logic)
  const isAdmin = user.email?.endsWith("@admin.com") || false;

  if (!isAdmin) {
    return c.json(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Admin access required",
        },
      },
      403
    );
  }

  // Return admin data
  return c.json({
    success: true,
    data: {
      message: "Admin endpoint accessed",
      adminUser: user.email,
    },
  });
});

export default app;
