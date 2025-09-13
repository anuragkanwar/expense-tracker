import { useMonthlySummary } from "@/api/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Text,
} from "@/components/ui";
import { Feather } from "@expo/vector-icons";
import { View } from "react-native";

export function Summary() {
  const { data, isPending } = useMonthlySummary();

  if (isPending || !data) {
    return null;
  }

  return (
    <View className="flex flex-1 flex-col gap-8">
      <View className="flex flex-1 flex-col gap-6">
        <View className="flex flex-1 flex-col gap-6 bg-rose-400 p-4 rounded-3xl">
          <Feather name="watch" size={32} color={"white"} />
          <View className="flex flex-col gap-2">
            <Text className="text-sm text-foreground">Expense</Text>
            <Text className="text-lg font-bold">$ 3400</Text>
          </View>
        </View>
        <View className="flex flex-1 flex-row gap-6 ">
          <View className="flex flex-col gap-6 bg-blue-400 p-4 rounded-3xl flex-1">
            <Feather name="watch" size={32} color={"white"} />
            <View className="flex flex-col gap-2">
              <Text className="text-sm">Income</Text>
              <Text className="text-lg font-bold">$ 3400</Text>
            </View>
          </View>
          <View className="flex flex-col gap-6 bg-green-400 p-4 rounded-3xl flex-1">
            <Feather name="watch" size={32} color={"white"} />
            <View className="flex flex-col gap-2">
              <Text className="text-sm">Saving</Text>
              <Text className="text-lg font-bold">$ 3400</Text>
            </View>
          </View>
        </View>
        <View className="flex flex-row gap-6 justify-between">
          <View className="flex flex-col gap-6 bg-yellow-400 p-4 rounded-3xl flex-1">
            <Feather name="watch" size={32} color={"white"} />
            <View className="flex flex-col gap-2">
              <Text className="text-sm">Loan Given</Text>
              <Text className="text-lg font-bold">$ 3400</Text>
            </View>
          </View>
          <View className="flex flex-col gap-6 bg-orange-400 p-4 rounded-3xl flex-1">
            <Feather name="watch" size={32} color={"white"} />
            <View className="flex flex-col gap-2">
              <Text className="text-sm">Loan Taken</Text>
              <Text className="text-lg font-bold">$ 3400</Text>
            </View>
          </View>
        </View>
      </View>
      <Card className="bg-secondary">
        <CardHeader className="">
          <CardTitle>Top Expense Category</CardTitle>
          <CardDescription>See what you spend most on</CardDescription>
        </CardHeader>
        <CardContent>
          <View className="flex flex-row justify-between items-stretch flex-1">
            <Text className="text-4xl">Rent</Text>
            <Text className="text-4xl">$ 14000</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
