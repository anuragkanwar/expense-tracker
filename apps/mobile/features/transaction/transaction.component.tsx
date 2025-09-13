import { SafeAreaView } from "react-native-safe-area-context";
import { TransactionHeader } from "./transactionHeader.component";
import { ScrollView } from "react-native";

export function Transaction() {
  return (
    <SafeAreaView className="flex flex-col flex-1 gap-4">
      <TransactionHeader />
      <ScrollView></ScrollView>
    </SafeAreaView>
  );
}
