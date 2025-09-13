import { Transaction } from "@/features/transaction/transaction.component";
import { View } from "react-native";

export default function TransactionStack() {
  return (
    <View className="flex-1">
      <View className="flex-1 px-4">
        <Transaction />
      </View>
    </View>
  );
}
