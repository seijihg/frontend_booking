import { Salon } from "./salon";

// Customer entity interface - matches the API response
export interface Customer {
  id: number;
  full_name: string;
  phone_number: string;
  salons: Salon[];
  created: string;
  modified: string;
}

// Request type for creating customers
export interface CreateCustomerRequest {
  full_name?: string;
  phone_number: string;
  salon_ids: number[];
}

// Request type for updating customers
export interface UpdateCustomerRequest {
  full_name?: string;
  phone_number?: string;
  salon_ids?: number[];
}
