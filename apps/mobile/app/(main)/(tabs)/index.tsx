import { ScrollView, View } from "react-native";
import { useHeader } from "@/hooks/useHeader";
import { Dashboard } from "@/features/dashboard/dashboard.component";
import { AddTransactionFloatingButton } from "@/features/dashboard/floatingButton/addTransaction.component";

export default function Home() {
  useHeader({ title: "Home" });

  return (
    <View className="flex-1">
      <View className="flex-1 px-4">
        <Dashboard />
      </View>
      <AddTransactionFloatingButton />
    </View>
  );
}
