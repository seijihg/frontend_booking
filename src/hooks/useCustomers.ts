import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomers, createCustomer } from "@/api/customerApi";

export const useCustomers = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { full_name: string; phone_number: string; salon: number }) => 
      createCustomer(data),
    onSuccess: () => {
      // Invalidate and refetch customers
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};