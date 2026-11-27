import { describe, expect, it } from "vitest";

import { toUserDto, type UserRow } from "./users";

const row: UserRow = {
  id: 1,
  password: "pbkdf2_sha256$1$s$h",
  lastLogin: null,
  isSuperuser: false,
  firstName: "Ada",
  lastName: "Lovelace",
  isStaff: true,
  isActive: true,
  dateJoined: "2025-01-02 03:04:05.123+00",
  phoneNumber: "+447700900123",
  created: "2025-01-02 03:04:05.123456+00",
  modified: "2025-02-03 10:00:00+00",
  email: "ada@example.com",
  isOwner: true,
  fullName: "Ada Lovelace",
};

describe("toUserDto", () => {
  it("maps columns to the snake_case DTO with ISO timestamps", () => {
    const dto = toUserDto(row, [1, 2], [5]);
    expect(dto).toEqual({
      id: 1,
      phone_number: "+447700900123",
      salons: [1, 2],
      last_login: null,
      first_name: "Ada",
      last_name: "Lovelace",
      is_staff: true,
      is_active: true,
      date_joined: "2025-01-02T03:04:05.123Z",
      created: "2025-01-02T03:04:05.123Z",
      modified: "2025-02-03T10:00:00.000Z",
      email: "ada@example.com",
      is_owner: true,
      full_name: "Ada Lovelace",
      addresses: [5],
    });
    expect(dto).not.toHaveProperty("password");
  });

  it("converts a non-null last_login", () => {
    const dto = toUserDto({ ...row, lastLogin: "2025-03-04 05:06:07+00" }, [], []);
    expect(dto.last_login).toBe("2025-03-04T05:06:07.000Z");
  });
});
