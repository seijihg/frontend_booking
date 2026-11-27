import "server-only";
import { and, asc, eq, gte, lt } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import {
  appointmentAppointment,
  customerCustomer,
  customerCustomerSalons,
} from "@/server/db/schema";
import { createAppointment } from "@/server/services/appointments";
import { createCustomer } from "@/server/services/customers";
import type { UserDto } from "@/server/services/users";
import type { VoiceCustomer, VoiceRepo } from "./executor";

async function findInSalon(
  salonId: number,
  condition: ReturnType<typeof eq>
): Promise<VoiceCustomer | null> {
  const [row] = await getDb()
    .select({
      id: customerCustomer.id,
      fullName: customerCustomer.fullName,
      phoneNumber: customerCustomer.phoneNumber,
    })
    .from(customerCustomer)
    .innerJoin(
      customerCustomerSalons,
      eq(customerCustomerSalons.customerId, customerCustomer.id)
    )
    .where(and(eq(customerCustomerSalons.salonId, salonId), condition))
    .orderBy(asc(customerCustomer.id))
    .limit(1);
  return row ?? null;
}

/** Real repository; writes go through the Phase 2 services so tenancy matches manual bookings. */
export function createDrizzleRepo(user: UserDto): VoiceRepo {
  return {
    findCustomerByPhone: (salonId, phone) =>
      findInSalon(salonId, eq(customerCustomer.phoneNumber, phone)),

    findCustomerById: (salonId, customerId) =>
      findInSalon(salonId, eq(customerCustomer.id, customerId)),

    async createCustomer({ fullName, phone, salonId }) {
      const dto = await createCustomer(user, {
        full_name: fullName,
        phone_number: phone,
        salon_ids: [salonId],
      });
      return { id: dto.id, fullName: dto.full_name, phoneNumber: dto.phone_number };
    },

    async listAppointmentsOnDay(salonId, columnId, dayStartIso, dayEndIso) {
      return getDb()
        .select({
          appointmentTime: appointmentAppointment.appointmentTime,
          endTime: appointmentAppointment.endTime,
        })
        .from(appointmentAppointment)
        .where(
          and(
            eq(appointmentAppointment.salonId, salonId),
            eq(appointmentAppointment.columnId, columnId),
            gte(appointmentAppointment.appointmentTime, dayStartIso),
            lt(appointmentAppointment.appointmentTime, dayEndIso)
          )
        );
    },

    async createAppointment(input) {
      const dto = await createAppointment(user, {
        salon: input.salonId,
        customer: input.customerId,
        appointment_time: input.appointmentTime,
        end_time: input.endTime,
        comment: input.comment,
        column_id: input.columnId,
      });
      return { id: dto.id };
    },
  };
}
