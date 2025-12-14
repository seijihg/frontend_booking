import { 
  CreateSalonRequest,
  UpdateSalonRequest,
  CreateSalonResponse, 
  GetSalonResponse,
  ListSalonsResponse,
  Salon 
} from "@/types/salon";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/";

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Create a new salon
export async function createSalon(data: CreateSalonRequest): Promise<CreateSalonResponse> {
  const response = await fetch(`${API_URL}salons/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return handleResponse<CreateSalonResponse>(response);
}

// Get a salon by ID
export async function getSalon(salonId: number): Promise<GetSalonResponse> {
  const response = await fetch(`${API_URL}salons/${salonId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse<GetSalonResponse>(response);
}

// Get all salons (with optional pagination)
export async function getSalons(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<ListSalonsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.page) {
    queryParams.append("page", params.page.toString());
  }
  if (params?.pageSize) {
    queryParams.append("page_size", params.pageSize.toString());
  }
  if (params?.search) {
    queryParams.append("search", params.search);
  }

  const url = `${API_URL}salons/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse<ListSalonsResponse>(response);
}

// Update a salon
export async function updateSalon(
  salonId: number, 
  data: UpdateSalonRequest
): Promise<CreateSalonResponse> {
  const response = await fetch(`${API_URL}salons/${salonId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  console.log(data)
  return handleResponse<CreateSalonResponse>(response);
}

// Delete a salon
export async function deleteSalon(salonId: number): Promise<void> {
  const response = await fetch(`${API_URL}salons/${salonId}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  // DELETE typically returns 204 No Content
  return;
}