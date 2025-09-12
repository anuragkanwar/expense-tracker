import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Avatar, AvatarFallback, AvatarImage, Text } from "../ui";
import { authClient } from "@/lib/auth-client";
import { useHeaderStore } from "@/store/header-store";
import { useSegments, useRouter } from "expo-router";

function deriveTitle(segments: string[]): string {
  if (!segments.length) return "";
  const clean = segments.filter((s) => !s.startsWith("("));
  if (!clean.length) return "";
  const last = clean[clean.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1);
}

function useAutoBack(): { showBack: boolean; titleFromRoute: string } {
  const segments = useSegments();
  const titleFromRoute = deriveTitle(segments as string[]);
  const tabsIndex = (segments as string[]).indexOf("(tabs)");
  if (tabsIndex === -1) {
    const nonGroups = (segments as string[]).filter((s) => !s.startsWith("("));
    return { showBack: nonGroups.length > 1, titleFromRoute };
  }
  const afterTabs = (segments as string[]).slice(tabsIndex + 1);
  return { showBack: afterTabs.length > 1, titleFromRoute };
}

export const PersistentMainHeader: React.FC = React.memo(() => {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { data } = authClient.useSession();
  const userName = data?.user?.name;
  const cfg = useHeaderStore((s) => s.current);
  const { showBack: autoShowBack, titleFromRoute } = useAutoBack();

  const showBack = cfg.showBack ?? autoShowBack;
  const title = cfg.title ?? titleFromRoute;
  const backgroundColor = cfg.backgroundColor || "#2b7fff";

  return (
    <View
      style={{ paddingTop: top, backgroundColor }}
      className="rounded-b-2xl"
    >
      <View className="flex-row items-center justify-between h-12 px-4 pb-3">
        <View className="w-1/4">
          {showBack &&
            (cfg.left ?? (
              <TouchableOpacity onPress={() => router.back()} className="p-1">
                <Feather name="arrow-left" size={24} color="black" />
              </TouchableOpacity>
            ))}
          {!showBack && cfg.left}
        </View>
        <View className="w-2/4 items-center">
          {cfg.center ?? (
            <Text className="text-lg font-bold" numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>
        <View className="w-1/4 flex-row items-center justify-end space-x-2">
          {cfg.right}
          <TouchableOpacity className="p-1">
            {userName ? (
              <Avatar alt={userName}>
                <AvatarImage source={{ uri: "https://placehold.co/64" }} />
                <AvatarFallback>
                  <Text className="uppercase">{userName.substring(0, 1)}</Text>
                </AvatarFallback>
              </Avatar>
            ) : (
              <View className="w-8 h-8 rounded-full bg-muted" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      {cfg.bottom && <View className="px-4 pb-2">{cfg.bottom}</View>}
    </View>
  );
});

PersistentMainHeader.displayName = "PersistentMainHeader";
