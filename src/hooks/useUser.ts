import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser, UpdateUserRequest } from "@/api/userApiClient";
import { useUserStore } from "@/stores/userStore";

// Query keys for user
export const userKeys = {
  all: ["user"] as const,
  detail: (id: number) => [...userKeys.all, "detail", id] as const,
};

// Hook to update a user
export function useUpdateUser(userId: number) {
  const queryClient = useQueryClient();
  const { setUser, user } = useUserStore();

  return useMutation({
    mutationFn: (data: UpdateUserRequest) => updateUser(userId, data),
    onSuccess: (updatedUser) => {
      // Update the Zustand store with the new user data
      setUser(updatedUser);

      // Also invalidate any queries that might be caching user data
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error) => {
      console.error("Error updating user:", error);
    },
  });
}
