import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { groupsKeys } from "./queryKeys";

type GroupMember = {
  userId: number;
  name: string;
  email: string;
  joinedAt: string;
};

export function useGroupMembers(groupId: number) {
  return useSuspenseQuery({
    queryKey: groupsKeys.membersByGroup(groupId),
    queryFn: async () => {
      const resp = await api.get<GroupMember[]>(`/groups/${groupId}/members`);
      return resp.data;
    },
  });
}
