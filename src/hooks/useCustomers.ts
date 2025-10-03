import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomers, getCustomer, createCustomer } from "@/api/customerApi";

export const useCustomers = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });
};

export const useCustomer = (customerId: number | undefined) => {
  return useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => getCustomer(customerId!),
    enabled: !!customerId,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { full_name: string; phone_number: string; salon_ids: number[] }) =>
      createCustomer(data),
    onSuccess: () => {
      // Invalidate and refetch customers
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};