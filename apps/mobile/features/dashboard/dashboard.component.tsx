import { ScrollView, View } from "react-native";
import { DashboardHeader } from "./header/dashboardHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { Summary } from "./summary/summary.component";
import { Text } from "@/components/ui";
export function Dashboard() {
  return (
    <SafeAreaView className="flex flex-col flex-1 gap-4">
      <DashboardHeader />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Summary />
      </ScrollView>
    </SafeAreaView>
  );
}
