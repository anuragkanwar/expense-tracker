import { authClient } from "@/lib/auth-client";
import { Redirect, Stack } from "expo-router";

export default function rootLayout() {
  const { data } = authClient.useSession();
  if (data) {
    return <Redirect href={"/(tabs)"} />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
