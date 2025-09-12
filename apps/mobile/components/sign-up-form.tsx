import { SocialConnections } from "@/components/social-connections";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "expo-router";
import * as React from "react";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

export function SignUpForm() {
  const passwordInputRef = React.useRef<TextInput>(null);
  const emailInputRef = React.useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  function onUsernameSubmitEditing() {
    emailInputRef.current?.focus();
  }
  const router = useRouter();
  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  async function onSubmit() {
    await authClient.signUp.email({
      email: email,
      name: username,
      password: password,
      fetchOptions: {
        onSuccess() {
          router.navigate("/(tabs)");
        },
      },
    });
  }

  return (
    <View className="gap-6">
      <Card className="bg-inherit border-border/0 sm:border-border shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">
            Create your account
          </CardTitle>
          <CardDescription className="text-center sm:text-left">
            Welcome! Please fill in the details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="name"
                keyboardType="default"
                autoComplete="username"
                autoCapitalize="none"
                onSubmitEditing={onUsernameSubmitEditing}
                returnKeyType="next"
                defaultValue={username}
                onChangeText={(name) => setUsername(name)}
                submitBehavior="submit"
              />
            </View>
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                ref={emailInputRef}
                id="email"
                placeholder="m@example.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                onSubmitEditing={onEmailSubmitEditing}
                returnKeyType="next"
                defaultValue={email}
                onChangeText={(s) => setEmail(s)}
                submitBehavior="submit"
              />
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="password">Password</Label>
              </View>
              <Input
                ref={passwordInputRef}
                id="password"
                secureTextEntry
                returnKeyType="send"
                onSubmitEditing={onSubmit}
                defaultValue={password}
                onChangeText={(s) => setPassword(s)}
              />
            </View>
            <Button className="w-full" onPress={onSubmit}>
              <Text>Continue</Text>
            </Button>
          </View>
          <View className="flex flex-row justify-center gap-4">
            <Text className="text-center text-sm">
              Already have an account?{" "}
            </Text>
            <Pressable
              onPress={() => {
                router.navigate("/(auth)/sign-in");
              }}
            >
              <Text className="text-sm underline underline-offset-4">
                Sign in
              </Text>
            </Pressable>
          </View>
          <View className="flex-row items-center">
            <Separator className="flex-1" />
            <Text className="text-muted-foreground px-4 text-sm">or</Text>
            <Separator className="flex-1" />
          </View>
          <SocialConnections />
        </CardContent>
      </Card>
    </View>
  );
}
