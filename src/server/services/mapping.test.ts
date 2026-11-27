import { describe, expect, it } from "vitest";

import { scopeSalonIds, toCustomerDto, type CustomerRow } from "./customers";
import { toSalonDto, type AddressRow, type SalonRow } from "./salons";

const address: AddressRow = {
  id: 7,
  street: "1 St",
  city: "Berkhamsted",
  postalCode: "HP4 3AP",
  created: "2025-01-02 03:04:05.123456+00",
  modified: "2025-02-03 10:00:00+00",
};

const salon: SalonRow = {
  id: 1,
  name: "Salon",
  phoneNumber: "+441442000000",
  reminderTimeMinutes: 60,
  created: "2025-01-02 03:04:05+00",
  modified: "2025-01-02 03:04:05+00",
};

describe("toSalonDto", () => {
  it("maps columns to the snake_case DTO with nested addresses", () => {
    expect(toSalonDto(salon, [address])).toEqual({
      id: 1,
      name: "Salon",
      phone_number: "+441442000000",
      reminder_time_minutes: 60,
      addresses: [
        {
          id: 7,
          street: "1 St",
          city: "Berkhamsted",
          postal_code: "HP4 3AP",
          created: "2025-01-02T03:04:05.123Z",
          modified: "2025-02-03T10:00:00.000Z",
        },
      ],
      created: "2025-01-02T03:04:05.000Z",
      modified: "2025-01-02T03:04:05.000Z",
    });
  });
});

describe("toCustomerDto", () => {
  it("nests salon DTOs", () => {
    const row: CustomerRow = {
      id: 3,
      fullName: "Ada",
      phoneNumber: "+447700900123",
      created: "2025-01-02 03:04:05+00",
      modified: "2025-01-02 03:04:05+00",
    };
    const nested = toSalonDto(salon, [address]);
    expect(toCustomerDto(row, [nested])).toEqual({
      id: 3,
      full_name: "Ada",
      phone_number: "+447700900123",
      salons: [nested],
      created: "2025-01-02T03:04:05.000Z",
      modified: "2025-01-02T03:04:05.000Z",
    });
  });
});

describe("scopeSalonIds", () => {
  it("drops salons outside the caller scope and sorts", () => {
    expect(scopeSalonIds([5, 2, 9], [2, 5, 7])).toEqual([2, 5]);
    expect(scopeSalonIds([9], [1])).toEqual([]);
  });
});
