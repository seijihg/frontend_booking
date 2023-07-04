"use client";
import { useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";
import {
  DateType,
  DateValueType,
} from "react-tailwindcss-datepicker/dist/types";

type DateRange = {
  startDate: DateType | null;
  endDate: DateType | null;
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
    if (newValue !== null) {
      setValue(newValue);
    }
  };

  return (
    <>
      <Datepicker asSingle={true} value={value} onChange={handleValueChange} />
      This is the floating menu.
    </>
  );
}
