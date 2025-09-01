import { createMiddleware } from "hono/factory";
import { container } from "@/container";

export type InjectedServices = {
  studentService: import('@/services/student-service').StudentService;
};

declare module "hono" {
  interface ContextVariableMap {
    services: InjectedServices;
  }
}

export const dependencyInjector = createMiddleware(async (c, next) => {
  const scope = container.createScope();

  const services: InjectedServices = {
    studentService: scope.resolve("studentService"),
  };

  c.set("services", services);
  await next();
});

