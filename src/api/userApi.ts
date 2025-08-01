import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";

import { isTokenExpired } from "@/utils/tokens";
import { RefreshResponse } from "@/types/misc";

export default async function getUser() {
  const nextCookies = await cookies();

  let token = nextCookies.get("token")?.value;
  const refresh_token = nextCookies.get("refresh_token")?.value;

  if (!token || !refresh_token) {
    return;
  }

  let decoded_token = jwt.decode(token) as JwtPayload;

  if (isTokenExpired(decoded_token)) {
    const payload = {
      refresh: refresh_token,
    };
    const refresh_response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "token/refresh/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      }
    );

    if (!refresh_response.ok) {
      // Refresh token is expired
      return;
    }

    const data: RefreshResponse = await refresh_response.json();
    token = data.access;
    decoded_token = jwt.decode(token) as JwtPayload;
  }

  const userId = decoded_token.user_id;

  const res = await fetch(process.env.NEXT_PUBLIC_API_URL + `users/${userId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Recommendation: handle errors
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }

  return res.json();
}
