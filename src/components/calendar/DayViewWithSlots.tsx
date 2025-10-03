"use client";

import React, { useState } from "react";
import AppointmentSlotWrapper from "./AppointmentSlotWrapper";
import AppointmentDetailsModal from "./AppointmentDetailsModal";
import { Appointment } from "@/types/appointment";
import { Customer } from "@/types/customer";

interface DayViewWithSlotsProps {
  appointments: Appointment[];
  selectedDate: string;
  onSlotSelect?: (startTime: string, endTime: string) => void;
}

const DayViewWithSlots: React.FC<DayViewWithSlotsProps> = ({
  appointments,
  selectedDate,
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState<{
    appointment: Appointment;
    customer?: Customer;
    position: { top: number; left: number; width: number; height: number };
    colorScheme: { bg: string; text: string };
  } | null>(null);

  // Only show business hours: 7AM to 9PM (7:00 - 21:00)
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);

  const formatTime = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Column headers */}
      <div className="flex">
        <div className="w-14 flex-none border-r border-b border-gray-200" />
        <div className="grid flex-auto grid-cols-5 divide-x divide-gray-200 border-b border-gray-200">
          {[1, 2, 3, 4, 5].map((columnId) => (
            <div
              key={columnId}
              className="px-3 py-2 text-center text-sm font-semibold text-gray-900"
            >
              C{columnId}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-auto overflow-hidden">
        <div className="sticky left-0 z-10 w-14 flex-none border-r border-gray-200" />
        <div className="grid flex-auto grid-cols-5 grid-rows-1">
          {/* Horizontal lines for hours - spans all columns */}
          <div
            className="col-start-1 col-end-6 row-start-1 grid divide-y divide-gray-100"
            style={{ gridTemplateRows: "repeat(14, minmax(5.25rem, 1fr))" }}
          >
            {hours.map((hour) => (
              <div key={hour} className="relative">
                <div className="sticky left-0 z-20 -ml-14 mt-1 w-14 pr-2 text-right text-xs/5 text-gray-400">
                  {formatTime(hour)}
                </div>
              </div>
            ))}
          </div>

          {/* Vertical column dividers */}
          <div className="col-start-1 col-end-6 row-start-1 grid grid-cols-5 divide-x divide-gray-100">
            {[1, 2, 3, 4, 5].map((columnId) => (
              <div key={columnId} className="col-span-1" />
            ))}
          </div>

          {/* Appointments - now spans all 5 columns */}
          <ol
            className="col-start-1 col-end-6 row-start-1 grid grid-cols-5"
            style={{ gridTemplateRows: "repeat(56, minmax(0, 1fr))" }}
          >
            {appointments.map((apt, index) => {
              const [startHour, startMinute] = apt.startTime
                .split(":")
                .map(Number);
              const [endHour, endMinute] = apt.endTime.split(":").map(Number);

              // Filter out appointments outside business hours
              // Allow appointments that start before 9PM (21:00)
              if (startHour < 7 || startHour >= 21) {
                return null;
              }

              // Calculate grid row positions (4 slots per hour for 15-minute increments)
              // Adjust for 7AM start time
              const startRow =
                (startHour - 7) * 4 + Math.floor(startMinute / 15) + 1;
              const endRow = (endHour - 7) * 4 + Math.floor(endMinute / 15) + 1;
              const span = endRow - startRow;

              const gridRow = `${startRow} / span ${span}`;

              // Determine column position (default to column 1 if not specified)
              const columnId = apt.column_id || 1;
              const gridColumn = columnId;

              return (
                <AppointmentSlotWrapper
                  key={apt.id}
                  appointment={apt}
                  gridRow={gridRow}
                  gridColumn={gridColumn}
                  selectedDate={selectedDate}
                  colorSchemeIndex={index}
                  onClick={(appointment, customer, position, colorScheme) => {
                    setSelectedAppointment({
                      appointment,
                      customer,
                      position,
                      colorScheme: {
                        bg: colorScheme.bg,
                        text: colorScheme.text,
                      },
                    });
                  }}
                />
              );
            })}
          </ol>
        </div>
      </div>

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={
          selectedAppointment && selectedAppointment.customer
            ? {
                id: selectedAppointment.appointment.id,
                startTime: selectedAppointment.appointment.startTime,
                endTime: selectedAppointment.appointment.endTime,
                date: selectedAppointment.appointment.date || selectedDate,
                customer: selectedAppointment.customer,
                comment: selectedAppointment.appointment.comment,
              }
            : null
        }
        position={selectedAppointment?.position}
        colorScheme={selectedAppointment?.colorScheme}
      />
    </div>
  );
};

export default DayViewWithSlots;
