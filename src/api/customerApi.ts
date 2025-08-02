export const getCustomers = async () => {
  const res = await fetch(process.env.NEXT_PUBLIC_API_URL + `users/customers`, {
    credentials: "include",
  });

  // Recommendation: handle errors
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }

  return res.json();
};

export const getCustomer = async (customer: number) => {
  const res = await fetch(
    process.env.NEXT_PUBLIC_API_URL + `users/customers/${customer}/`,
    {
      credentials: "include",
    }
  );

  // Recommendation: handle errors
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch a customer");
  }

  return res.json();
};

export const createCustomer = async (data: {
  full_name: string;
  phone_number: string;
  salon: number;
}) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}users/customers/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    const text = await res.text();
    throw new Error(`Failed to create customer: ${text}`);
  }

  return res.json();
};
