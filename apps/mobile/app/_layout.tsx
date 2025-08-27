import { Stack } from "expo-router";
import "../global.css"
import { ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "react-native";
import { PortalHost } from '@rn-primitives/portal';
import { NAV_THEME } from "@/lib/theme";
import { useColorScheme } from 'react-native';
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return <ThemeProvider value={NAV_THEME[colorScheme ?? "dark"]}>
    <StatusBar barStyle={colorScheme === "dark" ? "dark-content" : "light-content"} />
    <Stack />
    <PortalHost />
  </ThemeProvider>
}
