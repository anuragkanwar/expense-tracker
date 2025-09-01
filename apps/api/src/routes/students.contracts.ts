import { createRoute, z } from '@hono/zod-openapi';
import {
  createStudentDto,
  updateStudentDto,
  studentResponseDto,
  studentListResponseDto,
} from '@/dtos/student';

// Define a reusable path parameter schema
const ParamsSchema = z.object({
  id: z.string().openapi({
    param: { name: 'id', in: 'path' },
    description: 'The ID of the student',
    example: 'user_2N3a9b...',
  }),
});

// Contract for POST /students
export const createStudentRoute = createRoute({
  method: 'post',
  path: '/students',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createStudentDto,
        },
      },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: studentResponseDto } },
      description: 'Student created successfully',
    },
    400: { description: 'Validation Error' },
    409: { description: 'Conflict (e.g., email already exists)' },
  },
});

// Contract for GET /students/:id
export const getStudentByIdRoute = createRoute({
  method: 'get',
  path: '/students/{id}',
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: studentResponseDto } },
      description: 'The requested student',
    },
    404: { description: 'Student not found' },
  },
});

// ... you would create similar route contracts for GET (list), PUT, and DELETE
