import { Stack } from "expo-router";
import "../global.css";
import { ThemeProvider } from "@react-navigation/native";
import { StatusBar, useColorScheme } from "react-native";
import { PortalHost } from "@rn-primitives/portal";
import { NAV_THEME } from "@/lib/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReactQueryDevTools } from "@dev-plugins/react-query";

const queryClient = new QueryClient({});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useReactQueryDevTools(queryClient);
  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? "dark"]}>
      <QueryClientProvider client={queryClient}>
        <StatusBar
          barStyle={colorScheme === "light" ? "dark-content" : "light-content"}
        />
        <Stack screenOptions={{ headerShown: false }} />
        <PortalHost />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
