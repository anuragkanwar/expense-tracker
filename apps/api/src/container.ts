import { createContainer, asClass, asValue } from "awilix";
import { StudentRepository } from "./repositories/impl/student-repository";
import { StudentService } from "./services/impl/student-service";
import { db } from "@pocket-pixie/db";

// Create the container
const container = createContainer();

// Register repositories
container.register({
  studentRepository: asClass(StudentRepository)
    .scoped()
    .inject(() => container.resolve("db")),
});

// Register services
container.register({
  studentService: asClass(StudentService)
    .scoped()
    .inject(() => container.resolve("studentRepository")),
});

// Register infrastructure
container.register({
  db: asValue(db),
});

// Export container
export { container };
export type Container = typeof container;
