"use client";
import { useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";

type DateRange = {
  startDate: Date | null;
  endDate: Date | null;
};

type OnChangeType = (
  value: DateValueType,
  e?: HTMLInputElement | null | undefined
) => void;

export default function FloatingCalendarPicker() {
  const [value, setValue] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });

  const handleValueChange: OnChangeType = (newValue) => {
    console.log("newValue:", newValue);
    // setValue(newValue);
  };

  return (
    <>
      <div className="relative">
        <div className="absolute top-full mt-2 p-4 bg-white shadow-lg rounded-md">
          <Datepicker
            asSingle={true}
            value={value}
            onChange={handleValueChange}
          />
          This is the floating menu.
        </div>
      </div>
    </>
  );
}
