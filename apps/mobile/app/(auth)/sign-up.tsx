import { SignUpForm } from "@/components/sign-up-form";
import { ScrollView, View } from "react-native";

export default function SignUpScreen() {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="sm:flex-1 items-center justify-center p-4 py-8 sm:py-4 mt-safe"
      keyboardDismissMode="interactive"
    >
      <View className="w-full">
        <SignUpForm />
      </View>
    </ScrollView>
  );
}
