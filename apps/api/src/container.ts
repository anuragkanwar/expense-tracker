import { createContainer, asClass, asValue, Lifetime } from "awilix";
import { StudentRepository } from "./repositories/impl/student-repository";
import { StudentService } from "./services/impl/student-service";
import { db } from "@pocket-pixie/db";

const container = createContainer();

// Register the database instance as a singleton value
container.register({
  db: asValue(db),
});

// Register other classes. Awilix will automatically inject dependencies
// based on the constructor parameter names.
container.register({
  // Repositories should be scoped to the request
  studentRepository: asClass(StudentRepository, { lifetime: Lifetime.SCOPED }),

  // Services should also be scoped to the request
  studentService: asClass(StudentService, { lifetime: Lifetime.SCOPED }),
});

export { container };
