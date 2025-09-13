import { Button, Text } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeader } from "@/hooks/useHeader";

export default function Splits() {
  useHeader({ title: "Splits" });
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
