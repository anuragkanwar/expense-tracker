import { createMiddleware } from "hono/factory";
import { container } from "../container";
import type { IStudentService } from "../services";

// Define the types of services using interfaces
export type InjectedServices = {
  studentService: IStudentService; // 👈 Use the INTERFACE type here
  // otherService: IOtherService;
};

// This declaration now uses the interface
declare module "hono" {
  interface ContextVariableMap {
    services: InjectedServices;
  }
}

export const dependencyInjector = createMiddleware(async (c, next) => {
  const scope = container.createScope();

  const services: InjectedServices = {
    studentService: scope.resolve<IStudentService>("studentService"),
  };

  c.set("services", services);
  await next();
});
