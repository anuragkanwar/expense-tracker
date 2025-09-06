import { Text, View } from "react-native";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function Index() {
  const { data } = authClient.useSession();
  const handleSignOut = async () => {
    await authClient.signOut();
  };
  return (
    <View>
      <Text>Welcome, {data?.user.name}</Text>
      <Button onPress={handleSignOut}>
        <Text>Sign Out</Text>
      </Button>
    </View>
  );
}
