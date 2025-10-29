import type {
  GroupMemberBulkResponse,
  MessageResponse,
  GroupMemberCreate,
  GroupMemberBulkCreate,
} from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { groupsKeys } from "./queryKeys";

export function useCreateGroupMember() {
  return useMutation<
    MessageResponse | GroupMemberBulkResponse,
    unknown,
    { groupId: number; data: GroupMemberCreate | GroupMemberBulkCreate },
    unknown
  >({
    mutationKey: groupsKeys.all,
    mutationFn: async ({
      groupId,
      data,
    }: {
      groupId: number;
      data: GroupMemberCreate | GroupMemberBulkCreate;
    }) => {
      const resp = await api.post<MessageResponse | GroupMemberBulkResponse>(
        `/groups/${groupId}/members`,
        data
      );
      return resp.data;
    },
  });
}
