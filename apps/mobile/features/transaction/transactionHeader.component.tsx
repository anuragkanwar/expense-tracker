import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { TouchableOpacity, View } from "react-native";

export function TransactionHeader() {
  const router = useRouter();

  return (
    <View className="pt-8 pb-2 flex flex-row justify-between items-center">
      <TouchableOpacity
        className="flex flex-row h-16 w-16 justify-center items-center rounded-full bg-secondary"
        onPress={() => {
          router.back();
        }}
      >
        <Feather name="chevron-left" color={"white"} size={22} />
      </TouchableOpacity>
    </View>
  );
}
