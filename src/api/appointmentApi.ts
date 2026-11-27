import { AppointmentPayload } from "@/types/appointment";

export const createAppointment = async (data: AppointmentPayload) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}appointments/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create appointment: ${text}`);
  }

  return res.json();
};

export const getAppointments = async (date?: string) => {
  const params = new URLSearchParams();

  if (date) {
    params.set("date", date);
  }

  const query = params.toString();
  const url = `${process.env.NEXT_PUBLIC_API_URL}appointments/${
    query ? `?${query}` : ""
  }`;

  const res = await fetch(url, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch appointments");
  }

  return res.json();
};

export const updateAppointment = async (
  appointmentId: number,
  data: Partial<AppointmentPayload>
) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}appointments/${appointmentId}/`,
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
    throw new Error(`Failed to update appointment: ${text}`);
  }

  return res.json();
};

export const deleteAppointment = async (appointmentId: number) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}appointments/${appointmentId}/`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  // Handle errors by triggering the nearest error boundary
  if (!res.ok) {
    throw new Error("Failed to delete appointment");
  }

  // DELETE returns 204 No Content, so we don't need to parse JSON
  // Just return success
  return { success: true };
};
