"use client";

import React from "react";

interface AppointmentSlotProps {
  id: string;
  title: string;
  startTime: string;
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
}

const AppointmentSlot: React.FC<AppointmentSlotProps> = ({
  id,
  title,
  startTime,
  date,
  gridRow,
  gridColumn = 1,
  colorScheme,
}) => {
  return (
    <li 
      style={{ gridRow, gridColumn }}
      className="relative mt-px flex"
    >
      <a
        href="#"
        className={`group absolute inset-1 flex flex-col overflow-y-auto rounded-lg ${colorScheme.bg} p-2 text-xs/5 ${colorScheme.hover}`}
      >
        <p className={`order-1 font-semibold ${colorScheme.text}`}>
          {title}
        </p>
        <p className={`${colorScheme.subtext} ${colorScheme.hoverSubtext}`}>
          <time dateTime={`${date}T${startTime}`}>
            {startTime}
          </time>
        </p>
      </a>
    </li>
  );
};

// Color schemes for appointments
export const appointmentColorSchemes = [
  { bg: 'bg-blue-50', hover: 'hover:bg-blue-100', text: 'text-blue-700', subtext: 'text-blue-500', hoverSubtext: 'group-hover:text-blue-700' },
  { bg: 'bg-pink-50', hover: 'hover:bg-pink-100', text: 'text-pink-700', subtext: 'text-pink-500', hoverSubtext: 'group-hover:text-pink-700' },
  { bg: 'bg-purple-50', hover: 'hover:bg-purple-100', text: 'text-purple-700', subtext: 'text-purple-500', hoverSubtext: 'group-hover:text-purple-700' },
  { bg: 'bg-green-50', hover: 'hover:bg-green-100', text: 'text-green-700', subtext: 'text-green-500', hoverSubtext: 'group-hover:text-green-700' },
  { bg: 'bg-yellow-50', hover: 'hover:bg-yellow-100', text: 'text-yellow-700', subtext: 'text-yellow-500', hoverSubtext: 'group-hover:text-yellow-700' },
  { bg: 'bg-indigo-50', hover: 'hover:bg-indigo-100', text: 'text-indigo-700', subtext: 'text-indigo-500', hoverSubtext: 'group-hover:text-indigo-700' },
  { bg: 'bg-red-50', hover: 'hover:bg-red-100', text: 'text-red-700', subtext: 'text-red-500', hoverSubtext: 'group-hover:text-red-700' },
  { bg: 'bg-orange-50', hover: 'hover:bg-orange-100', text: 'text-orange-700', subtext: 'text-orange-500', hoverSubtext: 'group-hover:text-orange-700' },
];

export const getColorScheme = (index: number) => {
  return appointmentColorSchemes[index % appointmentColorSchemes.length];
};

export default AppointmentSlot;