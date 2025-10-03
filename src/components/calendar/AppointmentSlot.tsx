"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Customer } from "@/types/customer";

interface AppointmentSlotProps {
  id: string;
  startTime: string;
  endTime: string;
  date?: string;
  gridRow: string;
  gridColumn?: number;
  colorScheme: {
    bg: string;
    hover: string;
    text: string;
    subtext: string;
    hoverSubtext: string;
  };
  customer: Customer;
  comment?: string;
  onClick?: (position: {
    top: number;
    left: number;
    width: number;
    height: number;
  }) => void;
}

const AppointmentSlot: React.FC<AppointmentSlotProps> = ({
  id,
  startTime,
  endTime,
  date,
  gridRow,
  gridColumn = 1,
  colorScheme,
  customer,
  comment,
  onClick,
}) => {
  const slotRef = useRef<HTMLDivElement>(null);

  // Calculate the duration and grid row span
  const calculateGridRowSpan = () => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    // Convert to minutes for easier calculation
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Calculate duration in minutes
    const durationMinutes = endMinutes - startMinutes;

    // Each 15-minute slot is 1 grid row, so divide by 15
    const rowSpan = Math.max(1, Math.ceil(durationMinutes / 15));

    // Parse the gridRow to get the starting row
    const startRow = parseInt(gridRow);

    // Return the grid row span (e.g., "2 / span 4" for a 1-hour appointment starting at row 2)
    return `${startRow} / span ${rowSpan}`;
  };

  const handleClick = () => {
    if (onClick && slotRef.current) {
      const rect = slotRef.current.getBoundingClientRect();
      onClick({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <li
      style={{ gridRow: calculateGridRowSpan(), gridColumn }}
      className="relative mt-px flex"
    >
      <motion.div
        ref={slotRef}
        layoutId={`appointment-${id}`}
        onClick={handleClick}
        onKeyPress={handleKeyPress}
        className={`group absolute inset-1 flex cursor-pointer flex-col overflow-y-auto rounded-lg ${colorScheme.bg} p-2 text-xs/5 ${colorScheme.hover} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        tabIndex={0}
        role="button"
        aria-label={`Appointment: ${customer?.full_name} from ${startTime} to ${endTime}. Click to view details`}
      >
        <p className={`order-1 font-semibold ${colorScheme.text}`}>
          {customer?.full_name}
        </p>
        <p className={`order-1 font-semibold ${colorScheme.text}`}>{comment}</p>
        <p className={`${colorScheme.subtext} ${colorScheme.hoverSubtext}`}>
          <time dateTime={`${date}T${startTime}`}>
            {startTime} - {endTime}
          </time>
        </p>
      </motion.div>
    </li>
  );
};

// Color schemes for appointments
export const appointmentColorSchemes = [
  {
    bg: "bg-blue-50",
    hover: "hover:bg-blue-100",
    text: "text-blue-700",
    subtext: "text-blue-500",
    hoverSubtext: "group-hover:text-blue-700",
  },
  {
    bg: "bg-pink-50",
    hover: "hover:bg-pink-100",
    text: "text-pink-700",
    subtext: "text-pink-500",
    hoverSubtext: "group-hover:text-pink-700",
  },
  {
    bg: "bg-purple-50",
    hover: "hover:bg-purple-100",
    text: "text-purple-700",
    subtext: "text-purple-500",
    hoverSubtext: "group-hover:text-purple-700",
  },
  {
    bg: "bg-green-50",
    hover: "hover:bg-green-100",
    text: "text-green-700",
    subtext: "text-green-500",
    hoverSubtext: "group-hover:text-green-700",
  },
  {
    bg: "bg-yellow-50",
    hover: "hover:bg-yellow-100",
    text: "text-yellow-700",
    subtext: "text-yellow-500",
    hoverSubtext: "group-hover:text-yellow-700",
  },
  {
    bg: "bg-indigo-50",
    hover: "hover:bg-indigo-100",
    text: "text-indigo-700",
    subtext: "text-indigo-500",
    hoverSubtext: "group-hover:text-indigo-700",
  },
  {
    bg: "bg-red-50",
    hover: "hover:bg-red-100",
    text: "text-red-700",
    subtext: "text-red-500",
    hoverSubtext: "group-hover:text-red-700",
  },
  {
    bg: "bg-orange-50",
    hover: "hover:bg-orange-100",
    text: "text-orange-700",
    subtext: "text-orange-500",
    hoverSubtext: "group-hover:text-orange-700",
  },
];

export const getColorScheme = (index: number) => {
  return appointmentColorSchemes[index % appointmentColorSchemes.length];
};

export default AppointmentSlot;
