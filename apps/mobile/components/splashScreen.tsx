import { authClient } from "@/lib/auth-client";
import { SplashScreen } from "expo-router";

export function SplashScreenController() {
  const { isPending } = authClient.useSession();

  if (!isPending) {
    SplashScreen.hideAsync();
  }

  return null;
}
