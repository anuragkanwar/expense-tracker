import { Button } from "@/components/ui/button";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">
        Welcome to Nativewind!
      </Text>
      <View>
        <Button variant={"destructive"}>
          <Text>Button</Text>
        </Button>
      </View>
      <View>
        <Button variant={"default"} className="hover:bg-red-500 bg-purple-500">
          <Text>Button</Text>
        </Button>
      </View>
    </View>
  );
}
