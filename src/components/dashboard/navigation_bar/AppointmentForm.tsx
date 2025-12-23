import FloatingCalendarPicker from "./FloatingCalendarPicker";
import { useCustomers } from "@/hooks/useCustomers";

export default function AppointmentForm() {
  const { isLoading, error, data } = useCustomers();

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
