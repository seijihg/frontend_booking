import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import FloatingCalendarPicker from "./FloatingCalendarPicker";
import { Customer } from "@/types/customer";
import { getCustomers } from "@/api/customerApi";

export default function AppointmentForm() {
  const { isLoading, error, data } = useQuery<Customer[], Error>(
    ["customers"],
    getCustomers
  );

  return (
    <>
      <form>
        {data?.map((todo) => (
          <li key={todo.id}>{todo.full_name}</li>
        ))}
        <FloatingCalendarPicker />
      </form>
    </>
  );
}
