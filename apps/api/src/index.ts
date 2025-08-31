import { Hono } from "hono";
import { Scalar } from "@scalar/hono-api-reference";
import studentRoutes from "@/routes/students";
import authRoutes from "@/routes/auth";
import { errorHandler } from "@/middleware/error-handler";
import { logger } from "@/middleware/logger";
import { diMiddleware } from "@/middleware/di-middleware";

// API setup
const app = new Hono();

// Global middlewares
app.use("*", logger());
app.use("*", diMiddleware);
app.use("*", errorHandler());

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    success: true,
    message: "Pocket Pixie API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    docs: "http://localhost:3000/docs",
  });
});

// API info endpoint
app.get("/health", (c) => {
  return c.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount auth routes
app.route("/api/auth", authRoutes);

// Mount student routes
app.route("/students", studentRoutes);

// OpenAPI documentation - generated from Zod schemas
app.get("/openapi.json", (c) => {
  // Generate OpenAPI spec from Zod schemas
  const spec = {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Pocket Pixie API",
      description: "Student management API built with Hono and Turso",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    paths: {
      "/students": {
        get: {
          summary: "Get all students",
          description: "Retrieve a paginated list of all students",
          parameters: [
            {
              name: "limit",
              in: "query",
              schema: { type: "string", default: "10" },
              description: "Number of students to return",
            },
            {
              name: "offset",
              in: "query",
              schema: { type: "string", default: "0" },
              description: "Number of students to skip",
            },
          ],
          responses: {
            200: {
              description: "List of students retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: {
                        $ref: "#/components/schemas/StudentListResponseDto",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create new student",
          description: "Create a new student record",
          requestBody: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateStudentDto" },
              },
            },
          },
          responses: {
            201: {
              description: "Student created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: { $ref: "#/components/schemas/StudentResponseDto" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            400: { description: "Validation error" },
            409: { description: "Email already exists" },
          },
        },
      },
      "/students/{id}": {
        get: {
          summary: "Get student by ID",
          description: "Retrieve a specific student by their unique identifier",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Student's unique identifier",
            },
          ],
          responses: {
            200: {
              description: "Student retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: { $ref: "#/components/schemas/StudentResponseDto" },
                    },
                  },
                },
              },
            },
            404: { description: "Student not found" },
          },
        },
        put: {
          summary: "Update student",
          description: "Update an existing student record",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Student's unique identifier",
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateStudentDto" },
              },
            },
          },
          responses: {
            200: {
              description: "Student updated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: { $ref: "#/components/schemas/StudentResponseDto" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            400: { description: "Validation error" },
            404: { description: "Student not found" },
            409: { description: "Email already exists" },
          },
        },
        delete: {
          summary: "Delete student",
          description: "Delete a student record by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Student's unique identifier",
            },
          ],
          responses: {
            200: {
              description: "Student deleted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            404: { description: "Student not found" },
          },
        },
      },
    },
    components: {
      schemas: {
        // Schemas derived from Zod DTOs
        CreateStudentDto: {
          type: "object",
          properties: {
            name: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              example: "John Doe",
              description: "Student's full name",
            },
            email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
              description: "Student's email address",
            },
            age: {
              type: "number",
              nullable: true,
              minimum: 1,
              maximum: 150,
              example: 25,
              description: "Student's age in years",
            },
          },
          required: ["name", "email"],
        },
        UpdateStudentDto: {
          type: "object",
          properties: {
            name: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              example: "John Doe",
              description: "Student's full name",
            },
            email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
              description: "Student's email address",
            },
            age: {
              type: "number",
              nullable: true,
              minimum: 1,
              maximum: 150,
              example: 25,
              description: "Student's age in years",
            },
          },
        },
        StudentResponseDto: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "550e8400-e29b-41d4-a716-446655440000",
              description: "Unique student identifier",
            },
            name: {
              type: "string",
              example: "John Doe",
              description: "Student's full name",
            },
            email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
              description: "Student's email address",
            },
            age: {
              type: "number",
              nullable: true,
              example: 25,
              description: "Student's age in years",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-30T12:00:00.000Z",
              description: "When the student was created",
            },
          },
          required: ["id", "name", "email", "createdAt"],
        },
        StudentListResponseDto: {
          type: "object",
          properties: {
            students: {
              type: "array",
              items: { $ref: "#/components/schemas/StudentResponseDto" },
              description: "Array of student records",
            },
            total: {
              type: "number",
              example: 100,
              description: "Total number of students in database",
            },
            page: {
              type: "number",
              example: 1,
              description: "Current page number",
            },
            limit: {
              type: "number",
              example: 10,
              description: "Number of students per page",
            },
          },
          required: ["students", "total", "page", "limit"],
        },
      },
    },
  };

  return c.json(spec);
});

// Scalar API Reference UI
app.get(
  "/docs",
  Scalar({
    url: "/openapi.json",
    pageTitle: "Pocket Pixie API",
  })
);

// 404 handler (handled by error middleware)
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Endpoint not found",
      },
    },
    404 as any
  );
});

export default app;
