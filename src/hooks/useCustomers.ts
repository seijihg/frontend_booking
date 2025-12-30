import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  GetCustomersParams,
} from "@/api/customerApi";
import { Customer, UpdateCustomerRequest } from "@/types/customer";

// Fetch customers with optional salon filter and sorting
export const useCustomers = (params?: GetCustomersParams) => {
  return useQuery<Customer[]>({
    queryKey: ["customers", params?.salonId, params?.sortBy, params?.order],
    queryFn: () => getCustomers(params),
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
    mutationFn: (data: {
      full_name: string;
      phone_number: string;
      salon_ids: number[];
    }) => createCustomer(data),
    onSuccess: () => {
      // Invalidate and refetch customers
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

// Update customer mutation
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: number;
      data: UpdateCustomerRequest;
    }) => updateCustomer(customerId, data),
    onSuccess: () => {
      // Invalidate all customer queries
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

// Delete customer mutation
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: number) => deleteCustomer(customerId),
    onSuccess: () => {
      // Invalidate all customer queries
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};
