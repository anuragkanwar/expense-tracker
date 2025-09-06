import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://10.101.82.236:3000",
  withCredentials: true,
});

export const attachCookie = (
  cookie?: string,
  headers?: Record<string, string>
) => {
  return {
    headers: {
      ...headers,
      ...(cookie ? { Cookie: cookie } : {}),
    },
  };
};
