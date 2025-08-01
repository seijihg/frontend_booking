"use client";

import { useState } from "react";
import dayjs from "dayjs";
import DayViewWithSlots from "./calendar/DayViewWithSlots";

export default function SalonCalendar() {
  const [selectedDate] = useState(dayjs().format('YYYY-MM-DD'));

  // Sample appointments - replace with data from your API
  const appointments = [
    {
      id: "1",
      startTime: "01:00",
      endTime: "02:00",
      title: "Appointment 1"
    },
    {
      id: "2", 
      startTime: "02:00",
      endTime: "02:30",
      title: "Appointment 2"
    }
  ];

  return (
    <div className="h-full">
      <DayViewWithSlots
        appointments={appointments}
        selectedDate={selectedDate}
      />
    </div>
  );
}