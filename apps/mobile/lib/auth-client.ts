import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { SECURESTORESESSIONKEY } from "./constants";

// // const getApiUrl = () => {
//   // const isDevice = process.env.EXPO_PUBLIC_ENV === "device";
//   // const isDevelopment = process.env.NODE_ENV !== "production";
//
//   // if (isDevelopment) {
//   //   if (isDevice) {
//       // return "http://10.101.82.236:3000"; // Replace with your computer's IP
//     // } else {
//     //   return "http://localhost:3000";
//     // }
//   }
//   // return process.env.EXPO_PUBLIC_API_URL || "https://your-production-api.com";
// // };

export const authClient = createAuthClient({
  baseURL: "http://10.101.83.129:3000/api/v1/auth",
  plugins: [
    expoClient({
      scheme: "pocket-pixie",
      storagePrefix: SECURESTORESESSIONKEY,
      storage: SecureStore,
      disableCache: false,
    }),
  ],
});

export type Session = typeof authClient.$Infer.Session.session;
export type User = typeof authClient.$Infer.Session.user;
