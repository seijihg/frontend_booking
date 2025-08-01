"use client";

import React from "react";

interface Appointment {
  id: string;
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
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatTime = (hour: number) => {
    return hour.toString().padStart(2, '0') + ':00';
  };

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="min-h-full">
        <div className="grid grid-cols-[80px_1fr]">
          {/* Time labels column */}
          <div className="sticky left-0 z-10 bg-white">
            {hours.map(hour => (
              <div 
                key={hour} 
                className="h-16 flex items-center justify-center text-sm text-gray-500 border-b border-gray-200"
              >
                {formatTime(hour)}
              </div>
            ))}
          </div>
          
          {/* Calendar slots column */}
          <div className="relative">
            {/* Hour slots */}
            {hours.map(hour => (
              <div 
                key={hour} 
                className="h-16 border-b border-gray-200"
              />
            ))}
            
            {/* Appointments overlay */}
            {appointments.map(apt => {
              const [startHour, startMinute] = apt.startTime.split(':').map(Number);
              const [endHour, endMinute] = apt.endTime.split(':').map(Number);
              
              const top = (startHour * 64) + (startMinute / 60 * 64);
              const height = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60 * 64;
              
              return (
                <div
                  key={apt.id}
                  className="absolute left-0 right-0 mx-2 bg-blue-200 text-gray-700 p-2 text-sm overflow-hidden rounded"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                  }}
                >
                  <div className="font-medium">{apt.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayViewWithSlots;