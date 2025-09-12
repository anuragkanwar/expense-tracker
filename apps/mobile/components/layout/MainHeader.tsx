import { View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Avatar, AvatarFallback, AvatarImage, Text } from "../ui";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { authClient } from "@/lib/auth-client";

export default function MainHeader(props: NativeStackHeaderProps) {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { data } = authClient.useSession();
  const title = props.options.title || "";
  const canGoBack = props.navigation.canGoBack();

  return (
    <View
      style={{ paddingTop: top }}
      className="bg-primary px-4 pb-3 shadow-sm rounded-b-2xl"
    >
      <View className="flex-row items-center justify-between h-12">
        <View className="w-1/4">
          {canGoBack && (
            <TouchableOpacity onPress={() => router.back()} className="p-1">
              <Feather name="arrow-left" size={24} color="black" />
            </TouchableOpacity>
          )}
        </View>

        <View className="w-2/4 items-center">
          <Text className="text-lg font-bold">{title}</Text>
        </View>

        <View className="w-1/4 items-end">
          {data && (
            <TouchableOpacity onPress={() => {}} className="p-1">
              <Avatar alt={data.user.name || "user"}>
                <AvatarImage source={{ uri: "https://placehold.co/10" }} />
                <AvatarFallback>
                  <Text className="uppercase">
                    {data.user.name.substring(0, 1)}
                  </Text>
                </AvatarFallback>
              </Avatar>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
