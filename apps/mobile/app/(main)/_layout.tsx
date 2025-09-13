import { Stack } from "expo-router";
import { View } from "react-native";

export default function MainLayout() {
  return (
    <>
      <View className="flex-1">
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </View>
    </>
  );
}
