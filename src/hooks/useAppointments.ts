import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAppointments, createAppointment, updateAppointment, deleteAppointment } from "@/api/appointmentApi";
import { AppointmentPayload } from "@/types/appointment";

export const useAppointments = (date?: string) => {
  return useQuery({
    queryKey: date ? ["appointments", date] : ["appointments"],
    queryFn: () => getAppointments(date),
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AppointmentPayload) => createAppointment(data),
    onSuccess: () => {
      // Invalidate and refetch appointments
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};

export const useUpdateAppointment = (date?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AppointmentPayload> }) =>
      updateAppointment(id, data),
    onSuccess: () => {
      // Invalidate the specific date's appointments
      if (date) {
        queryClient.invalidateQueries({ queryKey: ["appointments", date] });
      }
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};

export const useDeleteAppointment = (date?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentId: number) => deleteAppointment(appointmentId),
    onSuccess: () => {
      // Invalidate the specific date's appointments
      if (date) {
        queryClient.invalidateQueries({ queryKey: ["appointments", date] });
      }
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};