import { Redirect, Stack } from "expo-router";
import "../global.css";
import { ThemeProvider } from "@react-navigation/native";
import { StatusBar, useColorScheme } from "react-native";
import { PortalHost } from "@rn-primitives/portal";
import { NAV_THEME } from "@/lib/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient({});

export default function RootNavigator() {
  const colorScheme = useColorScheme();
  useReactQueryDevTools(queryClient);

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
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <PortalHost />
        </SafeAreaProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
