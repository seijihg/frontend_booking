import { redirect } from "next/navigation";
import getUser from "@/api/userApi";
import CustomersView from "@/components/customers/CustomersView";

export const metadata = {
  title: "Customers | Booking System",
};

export default async function CustomersPage() {
  // Role-based access control
  const data = await getUser();
  const user = data?.user;

  if (!user?.is_owner && !user?.is_staff) {
    redirect("/dashboard");
  }

  return <CustomersView />;
}
