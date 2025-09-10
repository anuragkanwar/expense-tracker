import { Button, Text } from "@/components/ui";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();

  const handleClick = () => {
    router.navigate("/(auth)/sign-in");
  };

  return (
    <SafeAreaView className="h-full w-full flex justify-center px-4">
      <View className="flex flex-col gap-8 ">
        <View>
          <Text className="text-5xl">Save Expenses,</Text>
          <Text className="text-5xl">Share them,</Text>
          <Text className="text-5xl">and make your</Text>
          <Text className="text-5xl">passbook</Text>
        </View>
        <View className="">
          <Text className="text-sm">Get more here with different app</Text>
          <Text className="text-sm">functions and many other features</Text>
        </View>
        <View className="inline-block">
          <Button size={"sm"} onPress={handleClick}>
            <Text>Sign In</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
