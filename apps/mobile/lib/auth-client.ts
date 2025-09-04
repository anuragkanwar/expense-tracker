import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

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
  baseURL: "http://10.101.82.236:3000",
  plugins: [
    expoClient({
      scheme: "pocket-pixie",
      storagePrefix: "pocket-pixie",
      storage: SecureStore,
    }),
  ],
});
