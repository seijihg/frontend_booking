import { Customer, UpdateCustomerRequest } from "@/types/customer";

// Parameters for fetching customers with optional filtering and sorting
export interface GetCustomersParams {
  salonId?: number;
  sortBy?: "full_name" | "phone_number" | "created" | "modified";
  order?: "asc" | "desc";
}

// Fetch customers with optional salon filter and sorting
export const getCustomers = async (
  params?: GetCustomersParams
): Promise<Customer[]> => {
  const searchParams = new URLSearchParams();

  if (params?.salonId) {
    searchParams.append("salon", params.salonId.toString());
  }
  if (params?.sortBy) {
    searchParams.append("sort_by", params.sortBy);
  }
  if (params?.order) {
    searchParams.append("order", params.order);
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `${process.env.NEXT_PUBLIC_API_URL}customers/?${queryString}`
    : `${process.env.NEXT_PUBLIC_API_URL}customers/`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch customers: ${text}`);
  }

  return res.json();
};

export const getCustomer = async (customerId: number) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}customers/${customerId}/`,
    {
      credentials: "include",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch a customer");
  }

  return res.json();
};

export const createCustomer = async (data: {
  full_name: string;
  phone_number: string;
  salon_ids: number[];
}) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}customers/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create customer: ${text}`);
  }

  return res.json();
};

// Update customer
export const updateCustomer = async (
  customerId: number,
  data: UpdateCustomerRequest
) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}customers/${customerId}/`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update customer: ${text}`);
  }

  return res.json();
};

// Delete customer
export const deleteCustomer = async (customerId: number) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}customers/${customerId}/`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to delete customer: ${text}`);
  }

  return null; // 204 No Content
};
