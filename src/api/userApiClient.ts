import { User } from "@/types/user";

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
