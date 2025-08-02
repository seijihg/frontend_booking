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

export const getAppointments = async () => {
  const res = await fetch(process.env.NEXT_PUBLIC_API_URL + `appointments/`, {
    credentials: "include",
  });

  // Recommendation: handle errors
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
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
