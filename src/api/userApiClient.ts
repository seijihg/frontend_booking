import { User } from "@/types/user";

// Login request interface
export interface LoginRequest {
  email: string;
  password: string;
}

// Client-side function to login user
export const loginUser = async (payload: LoginRequest) => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "users/login/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error("An unexpected error occurred. Please try again.");
  }

  return response.json();
};

// Update user request interface
export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

// Client-side function to update user
export const updateUser = async (
  userId: number,
  data: UpdateUserRequest
): Promise<User> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}users/${userId}/`,
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
    throw new Error(`Failed to update user: ${text}`);
  }

  return res.json();
};
