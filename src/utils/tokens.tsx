import { JwtPayload } from "jsonwebtoken";

const isTokenExpired = (token: JwtPayload): boolean => {
  const currentTimestamp = Math.floor(Date.now() / 1000); // Get current time in seconds

  // Check if the token's expiration time is earlier than the current time

  return typeof token.exp === "number" && token.exp < currentTimestamp;
};

export { isTokenExpired };
