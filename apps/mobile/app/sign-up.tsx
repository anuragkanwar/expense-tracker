import { useState } from "react";
import { View } from "react-native";
import { authClient } from "@/lib/auth-client";

import { Button, Input, Text } from "@/components/ui";
export default function SignUp() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    await authClient.signUp.email({
      email,
      password,
      name,
    });
  };

  return (
    <View>
      <Input
        className="text-white"
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <Input
        className="text-white"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        className="text-white"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />
      <Button onPress={handleLogin}>
        <Text>Sign Up</Text>
      </Button>
    </View>
  );
}
