// import { Hono } from "hono";
// import type { IStudentService } from "@/services";
// import {
//   createStudentDto,
//   updateStudentDto,
//   studentResponseDto,
//   studentListResponseDto,
//   transformStudentForApi,
//   transformStudentsForApi,
// } from "@/dtos/student";
//
// const router = new Hono();
//
// // Service will be injected via middleware
// declare module "hono" {
//   interface ContextVariableMap {
//     studentService: IStudentService;
//   }
// }
//
// // GET /students - Get all students with pagination
// router.get("/", async (c) => {
//   try {
//     const studentService = c.get("studentService");
//     const limit = parseInt(c.req.query("limit") || "10");
//     const offset = parseInt(c.req.query("offset") || "0");
//
//     const students = await studentService.getAllStudents(limit, offset);
//     const transformedStudents = transformStudentsForApi(students);
//
//     // Validate the response format
//     const response = studentListResponseDto.parse({
//       students: transformedStudents,
//       total: students.length, // In real app, this would be total count from DB
//       page: Math.floor(offset / limit) + 1,
//       limit,
//     });
//
//     return c.json({
//       success: true,
//       data: response,
//     });
//   } catch (error: any) {
//     return c.json(
//       {
//         success: false,
//         error: {
//           code: "INTERNAL_ERROR",
//           message: "Failed to fetch students",
//         },
//       },
//       500
//     );
//   }
// });
//
// // GET /students/:id - Get student by ID
// router.get("/:id", async (c) => {
//   try {
//     const studentService = c.get("studentService");
//     const id = c.req.param("id");
//
//     const student = await studentService.getStudentById(id);
//
//     if (!student) {
//       return c.json(
//         {
//           success: false,
//           error: {
//             code: "NOT_FOUND",
//             message: "Student not found",
//           },
//         },
//         404
//       );
//     }
//
//     const transformedStudent = transformStudentForApi(student);
//
//     // Validate the response format
//     const response = studentResponseDto.parse(transformedStudent);
//
//     return c.json({
//       success: true,
//       data: response,
//     });
//   } catch (error) {
//     return c.json(
//       {
//         success: false,
//         error: {
//           code: "INTERNAL_ERROR",
//           message: "Failed to fetch student",
//         },
//       },
//       500
//     );
//   }
// });
//
// // POST /students - Create new student
// router.post("/", async (c) => {
//   try {
//     const studentService = c.get("studentService");
//     const body = await c.req.json();
//
//     // Validate input using DTO
//     const validatedData = createStudentDto.parse(body);
//
//     const student = await studentService.createStudent(validatedData);
//     const transformedStudent = transformStudentForApi(student);
//
//     // Validate the response format
//     const response = studentResponseDto.parse(transformedStudent);
//
//     return c.json(
//       {
//         success: true,
//         data: response,
//         message: "Student created successfully",
//       },
//       201
//     );
//   } catch (error: any) {
//     if (error.name === "ZodError") {
//       return c.json(
//         {
//           success: false,
//           error: {
//             code: "VALIDATION_ERROR",
//             message: "Invalid input data",
//             details: error.errors,
//           },
//         },
//         400
//       );
//     }
//
//     if (
//       error.message?.includes("Email already exists") ||
//       error.message?.includes("UNIQUE constraint")
//     ) {
//       return c.json(
//         {
//           success: false,
//           error: {
//             code: "CONFLICT",
//             message: "Email already exists",
//           },
//         },
//         409
//       );
//     }
//
//     return c.json(
//       {
//         success: false,
//         error: {
//           code: "INTERNAL_ERROR",
//           message: "Failed to create student",
//         },
//       },
//       500
//     );
//   }
// });
//
// // PUT /students/:id - Update student
// router.put("/:id", async (c) => {
//   try {
//     const studentService = c.get("studentService");
//     const id = c.req.param("id");
//     const body = await c.req.json();
//
//     // Validate input using DTO
//     const validatedData = updateStudentDto.parse(body);
//
//     const student = await studentService.updateStudent(id, validatedData);
//
//     if (!student) {
//       return c.json(
//         {
//           success: false,
//           error: {
//             code: "NOT_FOUND",
//             message: "Student not found",
//           },
//         },
//         404
//       );
//     }
//
//     const transformedStudent = transformStudentForApi(student);
//
//     // Validate the response format
//     const response = studentResponseDto.parse(transformedStudent);
//
//     return c.json({
//       success: true,
//       data: response,
//       message: "Student updated successfully",
//     });
//   } catch (error: any) {
//     if (error.name === "ZodError") {
//       return c.json(
//         {
//           success: false,
//           error: {
//             code: "VALIDATION_ERROR",
//             message: "Invalid input data",
//             details: error.errors,
//           },
//         },
//         400
//       );
//     }
//
//     if (
//       error.message?.includes("Email already exists") ||
//       error.message?.includes("UNIQUE constraint")
//     ) {
//       return c.json(
//         {
//           success: false,
//           error: {
//             code: "CONFLICT",
//             message: "Email already exists",
//           },
//         },
//         409
//       );
//     }
//
//     return c.json(
//       {
//         success: false,
//         error: {
//           code: "INTERNAL_ERROR",
//           message: "Failed to update student",
//         },
//       },
//       500
//     );
//   }
// });
//
// // DELETE /students/:id - Delete student
// router.delete("/:id", async (c) => {
//   try {
//     const studentService = c.get("studentService");
//     const id = c.req.param("id");
//
//     const deleted = await studentService.deleteStudent(id);
//
//     if (!deleted) {
//       return c.json(
//         {
//           success: false,
//           error: {
//             code: "NOT_FOUND",
//             message: "Student not found",
//           },
//         },
//         404
//       );
//     }
//
//     return c.json({
//       success: true,
//       message: "Student deleted successfully",
//     });
//   } catch (error: any) {
//     if (error.message?.includes("Student not found")) {
//       return c.json(
//         {
//           success: false,
//           error: {
//             code: "NOT_FOUND",
//             message: "Student not found",
//           },
//         },
//         404
//       );
//     }
//
//     return c.json(
//       {
//         success: false,
//         error: {
//           code: "INTERNAL_ERROR",
//           message: "Failed to delete student",
//         },
//       },
//       500
//     );
//   }
// });
//
// export default router;



import { OpenAPIHono } from '@hono/zod-openapi'; // Use OpenAPIHono
import type { IStudentService } from '@/services';
import {
  transformStudentForApi,
  // DTOs are now used in the contracts file
} from '@/dtos/student';
import {
  createStudentRoute,
  getStudentByIdRoute,
  // Import other route contracts here
} from './students.contracts';

// Use OpenAPIHono instead of Hono
const app = new OpenAPIHono();

// Service will be injected via middleware
declare module 'hono' {
  interface ContextVariableMap {
    studentService: IStudentService;
  }
}

// ==========================================================
// POST /students - Create new student (Refactored ✨)
// ==========================================================
app.openapi(createStudentRoute, async (c) => {
  const studentService = c.get('studentService');
  const validatedData = c.req.valid('json'); // 100% type-safe and validated!

  try {
    const student = await studentService.createStudent(validatedData);
    const response = transformStudentForApi(student);
    return c.json(response, 201);
  } catch (error: any) {
    // You only need to handle business logic errors now, not validation
    if (error.message?.includes('UNIQUE constraint')) {
      return c.json({ message: 'Email already exists' }, 409);
    }
    // Generic error for everything else
    return c.json({ message: 'Failed to create student' }, 500);
  }
});

// ==========================================================
// GET /students/:id - Get student by ID (Refactored ✨)
// ==========================================================
app.openapi(getStudentByIdRoute, async (c) => {
  const studentService = c.get('studentService');
  const { id } = c.req.valid('param'); // Typed and validated param

  const student = await studentService.getStudentById(id);

  if (!student) {
    return c.json({ message: 'Student not found' }, 404);
  }

  const response = transformStudentForApi(student);
  return c.json(response);
});

// ... refactor other endpoints (GET list, PUT, DELETE) similarly

export default app;
