import axios, { AxiosHeaders } from "axios";
import { authClient } from "@/lib/auth-client";

export const apiClient = axios.create({
  baseURL: "http://10.101.83.129:3000",
  withCredentials: true,
});

// Attach cookie to every request automatically
apiClient.interceptors.request.use(async (config) => {
  const cookie = authClient.getCookie?.();
  if (cookie) {
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }
    if (typeof (config.headers as AxiosHeaders).set === "function") {
      (config.headers as AxiosHeaders).set("Cookie", cookie);
    }
  }
  return config;
});
