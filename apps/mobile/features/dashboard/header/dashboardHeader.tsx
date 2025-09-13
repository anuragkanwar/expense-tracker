import { View } from "react-native";
import { Button, Separator, Text } from "@/components/ui";
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
        <Button variant={"outline"} size={"icon"} className="rounded-full">
          <Feather className="" color={"white"} size={18} name="bell" />
        </Button>
      </View>
    </>
  );
}
