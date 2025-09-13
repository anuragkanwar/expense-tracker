import { Button, Text } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeader } from "@/hooks/useHeader";
import { Feather } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

export default function Budget() {
  useHeader({
    title: "Budget",
    right: (
      <TouchableOpacity onPress={() => {}} className="p-1">
        <Feather name="plus" size={22} color="black" />
      </TouchableOpacity>
    ),
  });
  return (
    <SafeAreaView>
      <Text>Budget Page</Text>
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
