export interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  column_id?: number;
  customer?: number;
  comment?: string;
}

export interface BookingData {
  id: number;
  created: string;
  modified: string;
  appointment_time: string;
  end_time: string;
  comment: string;
  task_id: string;
  salon: number;
  user: number;
  customer: number;
  column_id?: number;
}

export interface AppointmentPayload {
  salon: number;
  user: number;
  appointment_time: string;
  end_time: string;
  customer: number;
  comment: string;
  column_id: number;
}

export interface TimeSlot {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  columnId?: number;
}
