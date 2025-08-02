"use client";

import React from "react";
import AppointmentSlot from "./AppointmentSlot";
import { useCustomer } from "@/hooks/useCustomers";
import { getColorScheme } from "./AppointmentSlot";

interface AppointmentSlotWrapperProps {
  appointment: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    date?: string;
    customer?: number;
    comment?: string;
  };
  gridRow: string;
  gridColumn: number;
  selectedDate: string;
  colorSchemeIndex: number;
  onClick: (
    appointment: any,
    customer: any,
    position: { top: number; left: number; width: number; height: number },
    colorScheme: { bg: string; text: string }
  ) => void;
}

const AppointmentSlotWrapper: React.FC<AppointmentSlotWrapperProps> = ({
  appointment,
  gridRow,
  gridColumn,
  selectedDate,
  colorSchemeIndex,
  onClick,
}) => {
  // Fetch customer data if customer ID exists
  const { data: customer, isLoading } = useCustomer(appointment.customer);
  
  const colorScheme = getColorScheme(colorSchemeIndex);

  const handleClick = (position: { top: number; left: number; width: number; height: number }) => {
    onClick(appointment, customer, position, colorScheme);
  };

  return (
    <AppointmentSlot
      id={appointment.id}
      title={appointment.title}
      startTime={appointment.startTime}
      endTime={appointment.endTime}
      date={appointment.date || selectedDate}
      gridRow={gridRow}
      gridColumn={gridColumn}
      colorScheme={colorScheme}
      onClick={handleClick}
    />
  );
};

export default AppointmentSlotWrapper;