import { useState } from "react";
import { View } from "react-native";
import { authClient } from "@/lib/auth-client";
import { Button, Input, Text } from "@/components/ui";
import { useRouter } from "expo-router";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const handleLogin = async () => {
    await authClient.signIn.email({
      email,
      password,
    });
  };

  return (
    <View className="h-full w-full">
      <Input placeholder="Email" value={email} onChangeText={setEmail} />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />
      <Button onPress={handleLogin}>
        <Text>Sign In</Text>
      </Button>
      <View className="mt-10">
        <Button
          size={"sm"}
          variant={"secondary"}
          onPress={() => {
            router.navigate("/sign-up");
          }}
        >
          <Text>Sign up</Text>
        </Button>
      </View>
    </View>
  );
}
