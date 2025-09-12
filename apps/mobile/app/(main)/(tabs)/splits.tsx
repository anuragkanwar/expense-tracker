import { Button, Text } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { SafeAreaView } from "react-native-safe-area-context";
export default function Splits() {
  return (
    <SafeAreaView>
      <Text>Splits Page</Text>
      <Button
        onPress={() => {
          authClient.signOut();
        }}
      >
        <Text>Sign Out</Text>
      </Button>
    </SafeAreaView>
  );
}
