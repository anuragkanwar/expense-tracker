import { createRoute, z } from "@hono/zod-openapi";
import {
  StudentCreateSchema,
  StudentUpdateSchema,
  StudentResponseSchema,
  StudentListResponseSchema,
} from "@/models/student";

// Define a reusable path parameter schema
const ParamsSchema = z.object({
  id: z.string().openapi({
    param: { name: "id", in: "path" },
    description: "The ID of the student",
    example: "user_2N3a9b...",
  }),
});

// Contract for POST /students
export const createStudentRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: StudentCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: StudentResponseSchema } },
      description: "Student created successfully",
    },
    400: { description: "Validation Error" },
    409: { description: "Conflict (e.g., email already exists)" },
  },
});

// Contract for GET /students/:id
export const getStudentByIdRoute = createRoute({
  method: "get",
  path: "/{id}",
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: StudentResponseSchema } },
      description: "The requested student",
    },
    404: { description: "Student not found" },
  },
});

export const deleteStudentByIdRoute = createRoute({
  method: "delete",
  path: "/{id}",
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: StudentResponseSchema } },
      description: "Deleted Student",
    },
    404: { description: "Student not found" },
    401: { description: "UnAuthorized to do so" },
  },
});
// ... you would create similar route contracts for GET (list), PUT, and DELETE
