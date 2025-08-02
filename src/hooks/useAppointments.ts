import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAppointments, createAppointment, deleteAppointment } from "@/api/appointmentApi";
import { AppointmentPayload } from "@/types/appointment";

export const useAppointments = () => {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments,
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

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentId: number) => deleteAppointment(appointmentId),
    onSuccess: () => {
      // Invalidate and refetch appointments
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};