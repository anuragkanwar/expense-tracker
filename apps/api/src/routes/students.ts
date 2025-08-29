import { Hono } from "hono";
import { StudentService } from "@/services/student-service";
import { createStudentSchema, updateStudentSchema } from "@/dtos/student";

const router = new Hono();
const studentService = new StudentService();

// GET /students - Get all students with pagination
router.get("/", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "10");
    const offset = parseInt(c.req.query("offset") || "0");

    const students = await studentService.getAllStudents(limit, offset);

    return c.json({
      success: true,
      data: students,
      pagination: {
        limit,
        offset,
        count: students.length,
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch students",
        },
      },
      500
    );
  }
});

// GET /students/:id - Get student by ID
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const student = await studentService.getStudentById(id);

    if (!student) {
      return c.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Student not found",
          },
        },
        404
      );
    }

    return c.json({
      success: true,
      data: student,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch student",
        },
      },
      500
    );
  }
});

// POST /students - Create new student
router.post("/", async (c) => {
  try {
    const body = await c.req.json();

    // Validate input
    const validatedData = createStudentSchema.parse(body);

    const student = await studentService.createStudent(validatedData);

    return c.json(
      {
        success: true,
        data: student,
        message: "Student created successfully",
      },
      201
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: error.errors,
          },
        },
        400
      );
    }

    if (error.message === "Email already exists") {
      return c.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "Email already exists",
          },
        },
        409
      );
    }

    return c.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create student",
        },
      },
      500
    );
  }
});

// PUT /students/:id - Update student
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    // Validate input
    const validatedData = updateStudentSchema.parse(body);

    const student = await studentService.updateStudent(id, validatedData);

    if (!student) {
      return c.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Student not found",
          },
        },
        404
      );
    }

    return c.json({
      success: true,
      data: student,
      message: "Student updated successfully",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: error.errors,
          },
        },
        400
      );
    }

    if (error.message === "Email already exists") {
      return c.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "Email already exists",
          },
        },
        409
      );
    }

    return c.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update student",
        },
      },
      500
    );
  }
});

// DELETE /students/:id - Delete student
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const deleted = await studentService.deleteStudent(id);

    if (!deleted) {
      return c.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Student not found",
          },
        },
        404
      );
    }

    return c.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error: any) {
    if (error.message === "Student not found") {
      return c.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Student not found",
          },
        },
        404
      );
    }

    return c.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete student",
        },
      },
      500
    );
  }
});

export default router;
