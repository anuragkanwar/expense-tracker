/**
 * Type-safe query parameter definition
 * Represents all valid types that can be used in query parameters
 */
export type QueryParamValue = string | number | boolean | undefined | null;

/**
 * Type-safe query parameter object
 */
export type QueryParams = Record<string, QueryParamValue>;

/**
 * Builds a URL query string from an object of parameters
 * @param params Object containing query parameters
 * @returns Formatted query string starting with '?' or empty string
 */
export function buildQueryString<T extends Record<string, QueryParamValue>>(
  params: T | null | undefined
): string {
  if (!params) return "";

  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join("&");
  return query ? `?${query}` : "";
}
