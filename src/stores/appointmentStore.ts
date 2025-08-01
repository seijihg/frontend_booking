import { create } from "zustand";
import { TimeSlot } from "@/types/appointment";

interface AppointmentState {
  selectedTimeSlot: TimeSlot | null;
  selectedColumnId: number | null;
  isAppointmentFormOpen: boolean;
  setSelectedTimeSlot: (timeSlot: TimeSlot | null) => void;
  setSelectedColumnId: (columnId: number | null) => void;
  setAppointmentFormOpen: (isOpen: boolean) => void;
  clearSelection: () => void;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  selectedTimeSlot: null,
  selectedColumnId: null,
  isAppointmentFormOpen: false,
  setSelectedTimeSlot: (timeSlot) => set({ selectedTimeSlot: timeSlot }),
  setSelectedColumnId: (columnId) => set({ selectedColumnId: columnId }),
  setAppointmentFormOpen: (isOpen) => set({ isAppointmentFormOpen: isOpen }),
  clearSelection: () => set({ selectedTimeSlot: null, selectedColumnId: null, isAppointmentFormOpen: false }),
}));