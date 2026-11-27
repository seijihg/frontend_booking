import "server-only";

import {
  loadSmsContext,
  type DeletedAppointmentSnapshot,
} from "@/server/services/appointments";
import { sendSms } from "./twilio";
import { cancellationText, confirmationText } from "./templates";

/** Safe for `after()`: never throws. */
export async function sendAppointmentConfirmation(appointmentId: number): Promise<void> {
  try {
    const ctx = await loadSmsContext(appointmentId);
    if (!ctx) return;
    if (!ctx.customerPhone) {
      console.info("[sms] skipped (customer has no phone number)", { appointmentId });
      return;
    }
    await sendSms(ctx.customerPhone, confirmationText(ctx));
  } catch (err) {
    console.error("[sms] confirmation failed", err);
  }
}

export async function sendAppointmentCancellation(
  snapshot: DeletedAppointmentSnapshot
): Promise<void> {
  try {
    if (!snapshot.customerPhone) {
      console.info("[sms] skipped (customer has no phone number)", {
        appointmentId: snapshot.dto.id,
      });
      return;
    }
    await sendSms(
      snapshot.customerPhone,
      cancellationText({ appointmentTime: snapshot.dto.appointment_time })
    );
  } catch (err) {
    console.error("[sms] cancellation failed", err);
  }
}
