import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  createSalon, 
  getSalon, 
  getSalons, 
  updateSalon, 
  deleteSalon 
} from "@/api/salonApi";
import { CreateSalonRequest, UpdateSalonRequest } from "@/types/salon";

// Query keys
export const salonKeys = {
  all: ['salons'] as const,
  lists: () => [...salonKeys.all, 'list'] as const,
  list: (params?: { page?: number; pageSize?: number; search?: string }) => 
    [...salonKeys.lists(), params] as const,
  details: () => [...salonKeys.all, 'detail'] as const,
  detail: (id: number) => [...salonKeys.details(), id] as const,
};

// Hook to get a single salon
export function useGetSalon(salonId: number, options?: {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
}) {
  return useQuery({
    queryKey: salonKeys.detail(salonId),
    queryFn: () => getSalon(salonId),
    enabled: !!salonId && (options?.enabled ?? true),
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

// Hook to get all salons
export function useGetSalons(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: salonKeys.list(params),
    queryFn: () => getSalons(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to create a salon
export function useCreateSalon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalonRequest) => createSalon(data),
    onSuccess: (data) => {
      // Invalidate and refetch salons list
      queryClient.invalidateQueries({ queryKey: salonKeys.lists() });
      
      // Optionally, add the new salon to the cache
      if (data?.id) {
        queryClient.setQueryData(
          salonKeys.detail(data.id), 
          data
        );
      }
    },
    onError: (error) => {
      console.error("Error creating salon:", error);
    },
  });
}

// Hook to update a salon
export function useUpdateSalon(salonId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSalonRequest) => 
      updateSalon(salonId, data),
    onSuccess: (data) => {
      // Invalidate both the specific salon and the list
      queryClient.invalidateQueries({ queryKey: salonKeys.detail(salonId) });
      queryClient.invalidateQueries({ queryKey: salonKeys.lists() });
      
      // Update the cache with new data
      if (data?.id) {
        queryClient.setQueryData(
          salonKeys.detail(data.id), 
          data
        );
      }
    },
    onError: (error) => {
      console.error("Error updating salon:", error);
    },
  });
}

// Hook to delete a salon
export function useDeleteSalon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (salonId: number) => deleteSalon(salonId),
    onSuccess: (_, salonId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: salonKeys.detail(salonId) });
      
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: salonKeys.lists() });
    },
    onError: (error) => {
      console.error("Error deleting salon:", error);
    },
  });
}

// Example usage with loading and error states
export function useSalonWithStates(salonId: number) {
  const query = useGetSalon(salonId);
  
  return {
    salon: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}