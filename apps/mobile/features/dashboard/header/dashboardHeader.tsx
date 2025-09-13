import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { Feather } from "@expo/vector-icons";
import { Profile } from "./Profile.component";
export function DashboardHeader() {
  const { data } = authClient.useSession();
  return (
    <>
      <View className="pt-10 pb-2 flex flex-row justify-between items-center">
        <View className="flex flex-row gap-2">
          <Profile name={data?.user.name || ""} />
          <View className="flex flex-col justify-center items-start">
            <Text className="text-xs">Welcome Back,</Text>
            <Text className="text-3xl capitalize">{data?.user.name}</Text>
          </View>
        </View>
        <TouchableOpacity
          className="flex flex-row h-16 w-16 justify-center items-center rounded-full bg-secondary"
          onPress={() => {}}
        >
          <Feather color={"white"} size={22} name="bell" />
        </TouchableOpacity>
      </View>
    </>
  );
}
