"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/endpoints";
import type { User } from "@/lib/types";

const ME_KEY = ["auth", "me"] as const;

/** Current user query. `null` (not error) means "not logged in". */
export function useCurrentUser() {
  return useQuery<User | null>({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      qc.setQueryData(ME_KEY, user);
      router.push("/boards");
    },
  });
}

export function useSignup() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: (user) => {
      qc.setQueryData(ME_KEY, user);
      router.push("/boards");
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
      qc.clear();
      router.push("/login");
    },
  });
}
