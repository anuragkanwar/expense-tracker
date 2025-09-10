import { Text } from "@/components/ui";
import { View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="h-full w-full flex flex-col justify-center">
      <View className="text-2xl">
        <Text>Save Expenses,</Text>
        <Text>Share them,</Text>
        <Text>and make your</Text>
        <Text>passbook</Text>
      </View>
      <View className="text-sm">
        <Text>Get more here with different app</Text>
        <Text>functions and many other features</Text>
      </View>
      <View></View>
    </View>
  );
}
