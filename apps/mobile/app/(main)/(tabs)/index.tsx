import { Button, Text } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { View } from "react-native";
export default function Home() {
  return (
    <View className="px-4">
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
    </View>
  );
}
