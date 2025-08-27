import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

// Get API URL based on environment
const getApiUrl = () => {
  // Check if we're running on a physical device (not simulator)
  const isDevice = process.env.EXPO_PUBLIC_ENV === "device";

  if (__DEV__) {
    // Development mode
    if (isDevice) {
      // Running on physical device - use computer's IP
      return "http://YOUR_COMPUTER_IP:3000"; // Replace with your computer's IP
    } else {
      // Running on simulator/emulator - use localhost
      return "http://localhost:3000";
    }
  }

  // Production/Staging - use environment variable
  return process.env.EXPO_PUBLIC_API_URL || "https://your-production-api.com";
};

export const authClient = createAuthClient({
  baseURL: getApiUrl(),
  plugins: [
    expoClient({
      scheme: "pocket-pixie",
      storagePrefix: "pocket-pixie",
      storage: SecureStore,
    }),
  ],
});
