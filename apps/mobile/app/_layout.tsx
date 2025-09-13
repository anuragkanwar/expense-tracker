import { Stack, SplashScreen } from "expo-router";
import "../global.css";
import { ThemeProvider } from "@react-navigation/native";
import { StatusBar, useColorScheme } from "react-native";
import { PortalHost } from "@rn-primitives/portal";
import { NAV_THEME } from "@/lib/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { authClient } from "@/lib/auth-client";

const queryClient = new QueryClient({});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useReactQueryDevTools(queryClient);
  const { data, isPending, error } = authClient.useSession();
  const isLoggedIn = !!data && !isPending && !error;
  if (!isPending) {
    SplashScreen.hideAsync();
  }

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? "dark"]}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar
            translucent={true}
            barStyle={
              colorScheme === "light" ? "dark-content" : "light-content"
            }
          />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!isLoggedIn}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
            <Stack.Protected guard={isLoggedIn}>
              <Stack.Screen name="(main)" />
            </Stack.Protected>
          </Stack>
          <PortalHost />
        </SafeAreaProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
