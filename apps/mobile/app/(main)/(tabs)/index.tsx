import { Button, Text } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { ScrollView, View } from "react-native";
import { useHeader } from "@/hooks/useHeader";

export default function Home() {
  useHeader({ title: "Home" });
  return (
    <ScrollView className="px-4">
      <Text>Home Page</Text>
      <Text>Home Page</Text>
      <Text>Home Page</Text>
      <Text>Home Page</Text>
      <Text>Home Page</Text>

      <Button
        onPress={() => {
          authClient.signOut();
        }}
      >
        <Text>Sign Out</Text>
      </Button>

      <View className="h-96 bg-red-200"></View>
      <View className="h-96 bg-blue-200"></View>
      <View className="h-96 bg-purple-200"></View>
      <View className="h-96 bg-green-200"></View>
    </ScrollView>
  );
}
