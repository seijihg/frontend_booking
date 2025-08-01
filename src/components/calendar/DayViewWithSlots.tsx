"use client";

import React from "react";
import AppointmentSlot, { getColorScheme } from "./AppointmentSlot";

interface Appointment {
  id: string;
  date?: string;
  startTime: string;
  endTime: string;
  title: string;
}

interface DayViewWithSlotsProps {
  appointments: Appointment[];
  selectedDate: string;
  onSlotSelect?: (startTime: string, endTime: string) => void;
}

const DayViewWithSlots: React.FC<DayViewWithSlotsProps> = ({
  appointments,
  selectedDate,
}) => {
  // Only show business hours: 7AM to 9PM (7:00 - 21:00)
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);

  const formatTime = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-auto">
        <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
        <div className="grid flex-auto grid-cols-1 grid-rows-1">
          {/* Horizontal lines for hours */}
          <div
            className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
            style={{ gridTemplateRows: "repeat(14, minmax(5.25rem, 1fr))" }}
          >
            {hours.map((hour) => (
              <div key={hour} className="relative">
                <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">
                  {formatTime(hour)}
                </div>
              </div>
            ))}
          </div>

          {/* Appointments */}
          <ol
            className="col-start-1 col-end-2 row-start-1 grid grid-cols-1"
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

              const colorScheme = getColorScheme(index);
              const gridRow = `${startRow} / span ${span}`;

              return (
                <AppointmentSlot
                  key={apt.id}
                  id={apt.id}
                  title={apt.title}
                  startTime={apt.startTime}
                  date={apt.date || selectedDate}
                  gridRow={gridRow}
                  colorScheme={colorScheme}
                />
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DayViewWithSlots;
