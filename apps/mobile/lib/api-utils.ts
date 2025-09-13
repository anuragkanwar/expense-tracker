import { apiClient } from "./api-client";
import type { AxiosRequestConfig } from "axios";

// Generic parse-capable schema type (e.g., Zod schemas)
export type ParseSchema<T> = { parse: (data: unknown) => T };

/**
 * Perform a GET request and validate the response with provided schema.
 */
export async function getValidated<T>(
  url: string,
  schema: ParseSchema<T>,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await apiClient.get(url, config);
  return schema.parse(res.data);
}

/**
 * Perform a mutation style request (POST/PUT/PATCH/DELETE) optionally validating response.
 */
export async function sendValidated<T>(
  method: "post" | "put" | "delete" | "patch",
  url: string,
  data?: any,
  schema?: ParseSchema<T>,
  config?: AxiosRequestConfig
): Promise<T | undefined> {
  const res = await apiClient.request({
    method,
    url,
    data,
    ...config,
  });
  return schema ? schema.parse(res.data) : undefined;
}

/**
 * Convenience alias names if future expansion needed.
 */
export const fetchValidated = getValidated;
export const requestValidated = sendValidated;
