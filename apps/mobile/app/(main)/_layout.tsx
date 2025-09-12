import MainHeader from "@/components/layout/MainHeader";
import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="(tabs)"
        options={{
          header: (props) => <MainHeader {...props} />,
          headerShown: true,
        }}
      />
      {/* <Stack.Screen name="../profile" options={{ presentation: "modal" }} /> */}
    </Stack>
  );
}
