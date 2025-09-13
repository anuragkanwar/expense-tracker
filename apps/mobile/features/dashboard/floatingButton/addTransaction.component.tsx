import { TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
export function AddTransactionFloatingButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => {
        router.push("/transaction");
      }}
      className="absolute bottom-6 right-6 bg-accent-foreground rounded-full w-14 h-14 items-center justify-center shadow-lg"
    >
      <Feather name="plus" size={28} color={"text-white"} />
    </TouchableOpacity>
  );
}
