"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDeleteAppointment } from "@/hooks/useAppointments";
import { Customer } from "@/types/customer";

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    date?: string;
    customer?: Customer;
    comment?: string;
  } | null;
  position?: { top: number; left: number; width: number; height: number };
  colorScheme?: {
    bg: string;
    text: string;
  };
}

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  isOpen,
  onClose,
  appointment,
  position,
  colorScheme = { bg: "bg-white", text: "text-gray-900" },
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const deleteAppointmentMutation = useDeleteAppointment();

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  const handleDelete = async () => {
    if (!appointment) return;

    try {
      await deleteAppointmentMutation.mutateAsync(parseInt(appointment.id));
      onClose();
    } catch (error) {
      console.error("Failed to delete appointment:", error);
    }
  };

  if (!appointment) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black bg-opacity-25"
            aria-hidden="true"
          />

          {/* Modal Container - Centers the modal vertically and horizontally */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={modalRef}
              layoutId={`appointment-${appointment.id}`}
              initial={
                position
                  ? {
                      top: position.top,
                      left: position.left,
                      width: position.width,
                      height: position.height,
                      position: "fixed" as const,
                    }
                  : {
                      opacity: 0,
                      scale: 0.9,
                    }
              }
              animate={{
                top: "auto",
                left: "auto",
                width: "auto",
                height: "auto",
                position: "static" as const,
                opacity: 1,
                scale: 1,
              }}
              exit={
                position
                  ? {
                      top: position.top,
                      left: position.left,
                      width: position.width,
                      height: position.height,
                      position: "fixed" as const,
                    }
                  : {
                      opacity: 0,
                      scale: 0.9,
                    }
              }
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className={`w-full max-w-sm sm:max-w-md rounded-xl ${colorScheme.bg} p-6 shadow-2xl`}
              style={{
                maxHeight: "calc(100vh - 2rem)",
                overflowY: "auto",
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`appointment-title-${appointment.id}`}
            >
              {/* Content */}
              <div className="space-y-4 mt-2 sm:mt-0 min-w-[300px]">
                <h3
                  id={`appointment-title-${appointment.id}`}
                  className={`text-lg font-semibold ${colorScheme.text}`}
                >
                  {appointment.title}
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Time
                    </span>
                    <span className="text-sm text-gray-900">
                      {appointment.startTime} - {appointment.endTime}
                    </span>
                  </div>

                  {appointment.date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        Date
                      </span>
                      <span className="text-sm text-gray-900">
                        {appointment.date}
                      </span>
                    </div>
                  )}

                  {appointment.customer && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        Customer
                      </span>
                      <span className="text-sm text-gray-900">
                        {appointment.customer.full_name}
                      </span>
                    </div>
                  )}

                  {appointment.comment && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Comment
                      </span>
                      <p className="mt-1 text-sm text-gray-900">
                        {appointment.comment}
                      </p>
                    </div>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={handleDelete}
                  disabled={deleteAppointmentMutation.isPending}
                  className="mt-4 w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Delete appointment"
                >
                  {deleteAppointmentMutation.isPending
                    ? "Deleting..."
                    : "Delete Appointment"}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AppointmentDetailsModal;
