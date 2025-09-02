import { OpenAPIHono } from "@hono/zod-openapi"; // Use OpenAPIHono
import {
  createStudentRoute,
  deleteStudentByIdRoute,
  getStudentByIdRoute,
} from "./students.contracts";
import { StudentCreate } from "@/models/student";

export const studentRoutes = new OpenAPIHono();

studentRoutes.openapi(createStudentRoute, async (c) => {
  const { studentService } = c.get("services");
  const validatedData = c.req.valid("json") as StudentCreate;
  try {
    const student = await studentService.createStudent(validatedData);
    return c.json(student, 201);
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint")) {
      return c.json({ message: "Email already exists" }, 409);
    }
    console.log(error);
    return c.json({ message: "Failed to create student" }, 500);
  }
});

studentRoutes.openapi(getStudentByIdRoute, async (c) => {
  const { studentService } = c.get("services");
  const { id } = c.req.valid("param");
  const student = await studentService.getStudentById(id);
  if (!student) {
    return c.json({ message: "Student not found" }, 404);
  }
  return c.json(student);
});

studentRoutes.openapi(deleteStudentByIdRoute, async (c) => {
  const { studentService } = c.get("services");
  const { id } = c.req.valid("param");
  const student = await studentService.deleteStudent(id);
  if (!student) {
    return c.json({ message: "Student not found" }, 404);
  }
  return c.json(student);
});
