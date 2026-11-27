import "server-only";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const day = (iso: string) => dayjs.utc(iso).format("YYYY-MM-DD");
const clock = (iso: string) => dayjs.utc(iso).format("h:mm A");
const name = (customerName: string) => customerName || "Customer";

/** Times are UTC wall-clock, never converted to local. */
export function confirmationText(args: {
  customerName: string;
  salonName: string;
  appointmentTime: string;
}): string {
  return `Hi ${name(args.customerName)}, Your appointment at ${args.salonName} has been confirmed for ${day(args.appointmentTime)} at ${clock(args.appointmentTime)}. See you soon!`;
}

export function cancellationText(args: { appointmentTime: string }): string {
  return `Hi, We regret to inform you that your scheduled appointment for ${day(args.appointmentTime)} ${clock(args.appointmentTime)} has been cancelled.`;
}

export function reminderText(args: {
  customerName: string;
  salonName: string;
  appointmentTime: string;
}): string {
  return `Hi ${name(args.customerName)}, You have an appointment coming up at ${clock(args.appointmentTime)}. Regards ${args.salonName}.`;
}
