// Address interface - matches the actual API response
export interface Address {
  id: number;
  street: string;
  city: string;
  postal_code: string;
  created: string;
  modified: string;
}

// Salon entity interface - matches the actual API response
export interface Salon {
  id: number;
  name: string;
  addresses: Address[];
  phone_number: string;
  created: string;
  modified: string;
}

// Create Salon request interface - what we send to create a salon
export interface CreateSalonRequest {
  name: string;
  addresses: Array<{
    street: string;
    city: string;
    postal_code: string;
  }>;
  phone_number: string;
}

// Update Salon request interface
export interface UpdateSalonRequest {
  name?: string;
  addresses?: Array<{
    street: string;
    city: string;
    postal_code: string;
  }>;
  phone_number?: string;
}

// Response interfaces - assuming the API returns the salon directly
export interface CreateSalonResponse {
  id: number;
  name: string;
  addresses: Address[];
  phone_number: string;
  created: string;
  modified: string;
}

// Get Salon response - returns the salon directly based on your example
export interface GetSalonResponse {
  id: number;
  name: string;
  addresses: Address[];
  phone_number: string;
  created: string;
  modified: string;
}

// List Salons response interface
export interface ListSalonsResponse {
  results: Salon[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

// Error response interface
export interface SalonErrorResponse {
  error?: string;
  detail?: string;
  message?: string;
}