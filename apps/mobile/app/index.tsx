import { Button } from "@/components/ui/button";
import { ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useState } from "react";
export default function Index() {
  const [text, setText] = useState("🐥");
  const [page, setPage] = useState("");

  const handleOnPageFetch = async () => {
    const res = await fetch("http://10.101.82.236:3000/");
    const json = await res.json();
    setPage(JSON.stringify(json));
  };

  const handleOnPress = () => {
    setText((prv) => prv + "🐥");
  };

  const handleClear = () => {
    setText("🐥");
  };

  return (
    <View className="flex-1 items-center justify-center pt-24">
      <Text className="text-xl font-bold text-blue-500">
        Welcome to Nativewind!
      </Text>
      <View>
        <Button onPress={handleClear} variant={"destructive"}>
          <Text>Button</Text>
        </Button>
      </View>
      <View>
        <Button
          onPress={() => {
            handleOnPress();
          }}
          variant={"default"}
          className="hover:bg-red-500 bg-purple-500"
        >
          <Text>Button</Text>
        </Button>
      </View>
      <View>
        <Text className="">{text}</Text>
      </View>
      <View className="mt-10 flex flex-col gap-4">
        <Button
          variant={"default"}
          className="hover:bg-red-500 bg-purple-500"
          onPress={handleOnPageFetch}
        >
          <Text>Fetch Page</Text>
        </Button>
        <View>
          <Text className="">{page}</Text>
        </View>
      </View>
      <ScrollView className="w-full">
        {[...Array(100)].map((_, index) => (
          <View className="block p-4 w-full" key={index}>
            <Text className="">Div #{index + 1}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
