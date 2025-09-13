import { Slot } from "expo-router";
import { View } from "react-native";

export default function MainLayout() {
  return (
    <>
      <View className="flex-1">
        <Slot />
      </View>
    </>
  );
}
