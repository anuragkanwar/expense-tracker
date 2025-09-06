import { Stack } from "expo-router";
import "../global.css";
import { ThemeProvider } from "@react-navigation/native";
import { StatusBar, useColorScheme } from "react-native";
import { PortalHost } from "@rn-primitives/portal";
import { NAV_THEME } from "@/lib/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { authClient } from "@/lib/auth-client";

const queryClient = new QueryClient({});

export default function RootNavigator() {
  const colorScheme = useColorScheme();
  const { data } = authClient.useSession();
  const isLoggedIn: boolean = !!data;
  useReactQueryDevTools(queryClient);

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? "dark"]}>
      <QueryClientProvider client={queryClient}>
        <StatusBar
          translucent={true}
          barStyle={colorScheme === "light" ? "dark-content" : "light-content"}
        />
        <Stack>
          <Stack.Protected guard={!isLoggedIn}>
            <Stack.Screen name="index" />
            <Stack.Screen name="sign-up" />
          </Stack.Protected>
          <Stack.Protected guard={isLoggedIn}>
            <Stack.Screen name="private" />
          </Stack.Protected>
        </Stack>
        <PortalHost />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
