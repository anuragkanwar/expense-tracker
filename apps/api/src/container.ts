import { createContainer, asClass, asValue, Lifetime } from "awilix";
import { StudentRepository } from "./repositories";
import { StudentService } from "./services";
import { db } from "@pocket-pixie/db";

const container = createContainer();

container.register({
  db: asValue(db),
});

container.register({
  // Repositories
  studentRepository: asClass(StudentRepository, { lifetime: Lifetime.SCOPED }),

  // Services
  studentService: asClass(StudentService, { lifetime: Lifetime.SCOPED }),
});

export { container };
