import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
export default function Layout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2b7fff",
        tabBarInactiveTintColor: "#657786",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#E1E8ED",
          height: 70,
          paddingTop: 8,
          marginBottom: insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="credit-card" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="passbook"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recurring"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="repeat" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="splits"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="share-2" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
