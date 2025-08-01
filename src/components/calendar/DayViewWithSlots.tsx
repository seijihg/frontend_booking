"use client";

import React from "react";

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
  
  console.log('DayViewWithSlots - appointments:', appointments);
  console.log('DayViewWithSlots - selectedDate:', selectedDate);

  const formatTime = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  // Random color selection for appointments
  const getColorScheme = (index: number) => {
    const colors = [
      { bg: 'bg-blue-50', hover: 'hover:bg-blue-100', text: 'text-blue-700', subtext: 'text-blue-500', hoverSubtext: 'group-hover:text-blue-700' },
      { bg: 'bg-pink-50', hover: 'hover:bg-pink-100', text: 'text-pink-700', subtext: 'text-pink-500', hoverSubtext: 'group-hover:text-pink-700' },
      { bg: 'bg-purple-50', hover: 'hover:bg-purple-100', text: 'text-purple-700', subtext: 'text-purple-500', hoverSubtext: 'group-hover:text-purple-700' },
      { bg: 'bg-green-50', hover: 'hover:bg-green-100', text: 'text-green-700', subtext: 'text-green-500', hoverSubtext: 'group-hover:text-green-700' },
      { bg: 'bg-yellow-50', hover: 'hover:bg-yellow-100', text: 'text-yellow-700', subtext: 'text-yellow-500', hoverSubtext: 'group-hover:text-yellow-700' },
      { bg: 'bg-indigo-50', hover: 'hover:bg-indigo-100', text: 'text-indigo-700', subtext: 'text-indigo-500', hoverSubtext: 'group-hover:text-indigo-700' },
      { bg: 'bg-red-50', hover: 'hover:bg-red-100', text: 'text-red-700', subtext: 'text-red-500', hoverSubtext: 'group-hover:text-red-700' },
      { bg: 'bg-orange-50', hover: 'hover:bg-orange-100', text: 'text-orange-700', subtext: 'text-orange-500', hoverSubtext: 'group-hover:text-orange-700' },
    ];
    
    return colors[index % colors.length];
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-auto">
        <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
        <div className="grid flex-auto grid-cols-1 grid-rows-1">
          {/* Horizontal lines for hours */}
          <div
            className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
            style={{ gridTemplateRows: 'repeat(14, minmax(5.25rem, 1fr))' }}
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
            style={{ gridTemplateRows: 'repeat(56, minmax(0, 1fr))' }}
          >
            {appointments.map((apt, index) => {
              const [startHour, startMinute] = apt.startTime.split(':').map(Number);
              const [endHour, endMinute] = apt.endTime.split(':').map(Number);
              
              console.log(`Appointment ${apt.id}: ${startHour}:${startMinute} - ${endHour}:${endMinute}`);
              
              // Filter out appointments outside business hours
              // Allow appointments that start before 9PM (21:00)
              if (startHour < 7 || startHour >= 21) {
                console.log(`Filtering out appointment ${apt.id} - outside business hours`);
                return null;
              }
              
              // Calculate grid row positions (4 slots per hour for 15-minute increments)
              // Adjust for 7AM start time
              const startRow = ((startHour - 7) * 4) + Math.floor(startMinute / 15) + 1;
              const endRow = ((endHour - 7) * 4) + Math.floor(endMinute / 15) + 1;
              const span = endRow - startRow;
              
              console.log(`Grid positioning - startRow: ${startRow}, endRow: ${endRow}, span: ${span}`);
              
              const colorScheme = getColorScheme(index);
              
              return (
                <li 
                  key={apt.id}
                  style={{ gridRow: `${startRow} / span ${span}` }}
                  className="relative mt-px flex"
                >
                  <a
                    href="#"
                    className={`group absolute inset-1 flex flex-col overflow-y-auto rounded-lg ${colorScheme.bg} p-2 text-xs/5 ${colorScheme.hover}`}
                  >
                    <p className={`order-1 font-semibold ${colorScheme.text}`}>
                      {apt.title}
                    </p>
                    <p className={`${colorScheme.subtext} ${colorScheme.hoverSubtext}`}>
                      <time dateTime={`${apt.date || selectedDate}T${apt.startTime}`}>
                        {apt.startTime}
                      </time>
                    </p>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DayViewWithSlots;