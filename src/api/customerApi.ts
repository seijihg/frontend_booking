export const getCustomers = async () => {
  const res = await fetch(process.env.NEXT_PUBLIC_API_URL + `users/customers`);

  // Recommendation: handle errors
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }

  return res.json();
};
