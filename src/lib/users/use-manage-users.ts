// React Query bindings for admin user management.
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  deleteUser,
  inviteUser,
  listUsers,
  restoreAccess,
  revokeAccess,
  setUserRole,
} from "./manage.functions";
import type { Role } from "@/lib/auth/permissions";
import type { InviteResult, UsersOverview } from "./types";

export const usersQueryOptions = queryOptions({
  queryKey: ["admin-users"] as const,
  queryFn: (): Promise<UsersOverview> => listUsers(),
  staleTime: 30_000,
});

export function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Unexpected error";
}

export function useUserMutations(onInvited: (result: InviteResult) => void) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: usersQueryOptions.queryKey });

  const invite = useServerFn(inviteUser);
  const changeRole = useServerFn(setUserRole);
  const revoke = useServerFn(revokeAccess);
  const restore = useServerFn(restoreAccess);
  const remove = useServerFn(deleteUser);

  return {
    invite: useMutation({
      mutationFn: (data: { email: string; role: Role }) => invite({ data }),
      onSuccess: (result) => {
        onInvited(result);
        invalidate();
      },
    }),
    setRole: useMutation({
      mutationFn: (data: { userId: string; role: Role }) => changeRole({ data }),
      onSuccess: invalidate,
    }),
    revoke: useMutation({
      mutationFn: (userId: string) => revoke({ data: { userId } }),
      onSuccess: invalidate,
    }),
    restore: useMutation({
      mutationFn: (userId: string) => restore({ data: { userId } }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (userId: string) => remove({ data: { userId } }),
      onSuccess: invalidate,
    }),
  };
}
