export const getBookings = async () => {
  const res = await fetch(process.env.NEXT_PUBLIC_API_URL + `appointments/`, {
    credentials: 'include',
  });

  // Recommendation: handle errors
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }

  return res.json();
};
// payload:
// {
//     "id": 25,
//     "created": "2025-08-01T16:43:33.926443Z",
//     "modified": "2025-08-01T16:43:33.926460Z",
//     "appointment_time": "2025-08-01T20:00:00Z",
//     "comment": "something to say",
//     "task_id": "",
//     "salon": 1,
//     "user": 1,
//     "customer": 2
// }
