import { Button, Text } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeader } from "@/hooks/useHeader";
import { TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function Passbook() {
  useHeader({
    title: "Passbook",
    right: (
      <TouchableOpacity onPress={() => {}} className="p-1">
        <Feather name="filter" size={22} color="black" />
      </TouchableOpacity>
    ),
  });

  return (
    <SafeAreaView>
      <Text>Passbook Page</Text>
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
