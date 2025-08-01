export interface AppointmentPayload {
  salon: number;
  user: number;
  appointment_time: string;
  customer: number;
  comment: string;
}

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
