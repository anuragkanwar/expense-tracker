import { Slot } from "expo-router";
import { View } from "react-native";
import { PersistentMainHeader } from "@/components/layout/PersistentMainHeader";

export default function MainLayout() {
  return (
    <View style={{ flex: 1 }}>
      <PersistentMainHeader />
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </View>
  );
}
