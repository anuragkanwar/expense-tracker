import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Text,
} from "@/components/ui";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ProfileProps = {
  name: string;
};

export const Profile: React.FC<ProfileProps> = ({ name }) => {
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 4,
    right: 4,
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <TouchableOpacity>
          <Avatar className="h-16 w-16" alt={""}>
            <AvatarFallback className="">
              <Text className="text-xl uppercase">{name.charAt(0)}</Text>
            </AvatarFallback>
          </Avatar>
        </TouchableOpacity>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        insets={contentInsets}
        sideOffset={8}
        className="w-64 rounded-3xl"
      >
        <DropdownMenuItem className="p-4">
          <Text className="text-lg">Profile</Text>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-4">
          <Text className="text-lg">Settings</Text>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-4">
          <Text className="text-lg">Logout</Text>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
