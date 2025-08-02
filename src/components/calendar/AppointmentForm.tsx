"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useAppointmentStore } from "@/stores/appointmentStore";
import { useUserStore } from "@/stores/userStore";
import { useCustomers, useCreateCustomer } from "@/hooks/useCustomers";
import { useCreateAppointment } from "@/hooks/useAppointments";
import { Customer } from "@/types/customer";
import dayjs from "dayjs";
import Alert from "@/components/common/Alert";
import CustomerSearchSelect from "@/components/forms/CustomerSearchSelect";

export default function AppointmentForm() {
  const { isAppointmentFormOpen, setAppointmentFormOpen, selectedColumnId } =
    useAppointmentStore();
  const { user } = useUserStore();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [selectedEndTime, setSelectedEndTime] = useState("10:00");
  const [comment, setComment] = useState("");
  const [columnId, setColumnId] = useState<number>(selectedColumnId || 1);

  // New customer form state
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  // Single alert state for all notifications
  const [alertState, setAlertState] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });

  // React Query hooks
  const { data: customers = [], isLoading: isLoadingCustomers } =
    useCustomers();
  const createCustomerMutation = useCreateCustomer();
  const createAppointmentMutation = useCreateAppointment();

  const handleClose = () => {
    setAppointmentFormOpen(false);
    // Reset form
    setSelectedCustomer(null);
    setShowNewCustomerForm(false);
    setSelectedDate(dayjs().format("YYYY-MM-DD"));
    setSelectedTime("09:00");
    setSelectedEndTime("10:00");
    setComment("");
    setNewCustomerName("");
    setNewCustomerPhone("");
    setColumnId(1);
    // Reset alert
    setAlertState({ show: false, type: "success", message: "" });
  };

  // Show alert helper
  const showAlert = (type: "success" | "error", message: string) => {
    setAlertState({ show: true, type, message });
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName || !newCustomerPhone || !user?.salon) return;

    try {
      const newCustomer = await createCustomerMutation.mutateAsync({
        full_name: newCustomerName,
        phone_number: newCustomerPhone,
        salon: user.salon,
      });

      setSelectedCustomer(newCustomer);
      setShowNewCustomerForm(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      showAlert("success", "Created user successfully.");
    } catch (error) {
      console.error("Error creating customer:", error);
      showAlert("error", "Failed to create a customer.");
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !user) {
      showAlert("error", "Please select a customer");
      return;
    }

    const appointmentDateTime = `${selectedDate}T${selectedTime}:00Z`;
    const appointmentEndDateTime = `${selectedDate}T${selectedEndTime}:00Z`;

    const payload = {
      salon: user.salon,
      user: user.id,
      appointment_time: appointmentDateTime,
      end_time: appointmentEndDateTime,
      customer: selectedCustomer.id,
      comment: comment,
      column_id: columnId,
    };

    try {
      await createAppointmentMutation.mutateAsync(payload);
      showAlert("success", "Appointment created successfully!");
      debugger;
      // Delay closing to show success message
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Error creating appointment:", error);
      showAlert("error", "Failed to create appointment");
    }
  };

  // Generate time slots from 7AM to 9PM in 15-minute intervals
  const timeSlots = [];
  for (let hour = 7; hour < 21; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      timeSlots.push(time);
    }
  }

  return (
    <Transition.Root show={isAppointmentFormOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900"
                    >
                      Add Appointment
                    </Dialog.Title>

                    <div className="mt-4 space-y-4">
                      {/* Customer Selection */}
                      <div>
                        <CustomerSearchSelect
                          customers={customers}
                          selectedCustomer={selectedCustomer}
                          onCustomerChange={setSelectedCustomer}
                          isLoading={isLoadingCustomers}
                          placeholder="Type to search for a customer..."
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowNewCustomerForm(!showNewCustomerForm)
                          }
                          className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          {showNewCustomerForm
                            ? "Cancel new customer"
                            : "Add new customer"}
                        </button>
                      </div>

                      {/* New Customer Form */}
                      {showNewCustomerForm && (
                        <div className="border-t border-gray-200 pt-4 space-y-4">
                          <div>
                            <label
                              htmlFor="full-name"
                              className="block text-sm font-medium leading-6 text-gray-900"
                            >
                              Full name
                            </label>
                            <div className="mt-2">
                              <input
                                type="text"
                                name="full-name"
                                id="full-name"
                                value={newCustomerName}
                                onChange={(e) =>
                                  setNewCustomerName(e.target.value)
                                }
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="John Doe"
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="phone"
                              className="block text-sm font-medium leading-6 text-gray-900"
                            >
                              Phone number
                            </label>
                            <div className="mt-2">
                              <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={newCustomerPhone}
                                onChange={(e) =>
                                  setNewCustomerPhone(e.target.value)
                                }
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="07999999988"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleCreateCustomer}
                            disabled={
                              createCustomerMutation.isPending ||
                              !newCustomerName ||
                              !newCustomerPhone
                            }
                            className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {createCustomerMutation.isPending
                              ? "Creating..."
                              : "Create Customer"}
                          </button>
                        </div>
                      )}

                      {/* Column Selection */}
                      <div>
                        <label
                          htmlFor="column"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Column
                        </label>
                        <div className="mt-2">
                          <select
                            id="column"
                            name="column"
                            value={columnId}
                            onChange={(e) =>
                              setColumnId(Number(e.target.value))
                            }
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          >
                            {[1, 2, 3, 4, 5].map((col) => (
                              <option key={col} value={col}>
                                Column {col}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Date Selection */}
                      <div>
                        <label
                          htmlFor="date"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Date
                        </label>
                        <div className="mt-2">
                          <input
                            type="date"
                            name="date"
                            id="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>

                      {/* Time Selection */}
                      <div>
                        <label
                          htmlFor="time"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Start Time
                        </label>
                        <div className="mt-2">
                          <select
                            id="time"
                            name="time"
                            value={selectedTime}
                            onChange={(e) => {
                              const newStartTime = e.target.value;
                              setSelectedTime(newStartTime);

                              // Auto-update end time to be 1 hour after start time
                              const [hours, minutes] = newStartTime
                                .split(":")
                                .map(Number);
                              const endHours = hours + 1;
                              if (endHours < 21) {
                                setSelectedEndTime(
                                  `${endHours
                                    .toString()
                                    .padStart(2, "0")}:${minutes
                                    .toString()
                                    .padStart(2, "0")}`
                                );
                              }
                            }}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          >
                            {timeSlots.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* End Time Selection */}
                      <div>
                        <label
                          htmlFor="end-time"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          End Time
                        </label>
                        <div className="mt-2">
                          <select
                            id="end-time"
                            name="end-time"
                            value={selectedEndTime}
                            onChange={(e) => setSelectedEndTime(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          >
                            {timeSlots.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Comment */}
                      <div>
                        <label
                          htmlFor="comment"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Comment
                        </label>
                        <div className="mt-2">
                          <textarea
                            rows={4}
                            name="comment"
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder="Add any notes about the appointment..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={createAppointmentMutation.isPending}
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createAppointmentMutation.isPending
                      ? "Creating..."
                      : "Add Appointment"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                  >
                    Cancel
                  </button>
                </div>

                {/* Single Alert Component for all notifications */}
                {alertState.show && (
                  <div className="mt-4">
                    <Alert
                      show={alertState.show}
                      type={alertState.type}
                      message={alertState.message}
                      onDismiss={() =>
                        setAlertState({
                          show: false,
                          type: "success",
                          message: "",
                        })
                      }
                    />
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
