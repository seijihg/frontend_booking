import { create } from "zustand";

interface TimeSlot {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

interface AppointmentState {
  selectedTimeSlot: TimeSlot | null;
  isAppointmentFormOpen: boolean;
  setSelectedTimeSlot: (timeSlot: TimeSlot | null) => void;
  setAppointmentFormOpen: (isOpen: boolean) => void;
  clearSelection: () => void;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  selectedTimeSlot: null,
  isAppointmentFormOpen: false,
  setSelectedTimeSlot: (timeSlot) => set({ selectedTimeSlot: timeSlot }),
  setAppointmentFormOpen: (isOpen) => set({ isAppointmentFormOpen: isOpen }),
  clearSelection: () => set({ selectedTimeSlot: null, isAppointmentFormOpen: false }),
}));