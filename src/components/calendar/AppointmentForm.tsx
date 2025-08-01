"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition, Listbox } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useAppointmentStore } from "@/stores/appointmentStore";
import { getCustomers, createCustomer } from "@/api/customerApi";
import { createAppointment } from "@/api/appointmentApi";
import { useUserStore } from "@/stores/userStore";
import dayjs from "dayjs";

interface Customer {
  id: number;
  full_name: string;
  phone_number: string;
  salon: number;
}

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function AppointmentForm() {
  const { isAppointmentFormOpen, setAppointmentFormOpen } = useAppointmentStore();
  const { user } = useUserStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // New customer form state
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    
    if (isAppointmentFormOpen) {
      fetchCustomers();
    }
  }, [isAppointmentFormOpen]);

  const handleClose = () => {
    setAppointmentFormOpen(false);
    // Reset form
    setSelectedCustomer(null);
    setShowNewCustomerForm(false);
    setSelectedDate(dayjs().format("YYYY-MM-DD"));
    setSelectedTime("09:00");
    setComment("");
    setNewCustomerName("");
    setNewCustomerPhone("");
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName || !newCustomerPhone || !user?.salon) return;

    setIsLoading(true);
    try {
      const newCustomer = await createCustomer({
        full_name: newCustomerName,
        phone_number: newCustomerPhone,
        salon: user.salon,
      });
      
      setCustomers([...customers, newCustomer]);
      setSelectedCustomer(newCustomer);
      setShowNewCustomerForm(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Failed to create customer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !user) {
      alert("Please select a customer");
      return;
    }

    const appointmentDateTime = `${selectedDate}T${selectedTime}:00Z`;
    
    const payload = {
      salon: user.salon,
      user: user.id,
      appointment_time: appointmentDateTime,
      customer: selectedCustomer.id,
      comment: comment,
    };

    setIsLoading(true);
    try {
      await createAppointment(payload);
      alert("Appointment created successfully!");
      handleClose();
      // Refresh the calendar to show new appointment
      window.location.reload();
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Failed to create appointment");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate time slots from 7AM to 9PM in 15-minute intervals
  const timeSlots = [];
  for (let hour = 7; hour < 21; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
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
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Add Appointment
                    </Dialog.Title>
                    
                    <div className="mt-4 space-y-4">
                      {/* Customer Selection */}
                      <div>
                        <Listbox value={selectedCustomer} onChange={setSelectedCustomer}>
                          <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">
                            Customer
                          </Listbox.Label>
                          <div className="relative mt-2">
                            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                              <span className="block truncate">
                                {selectedCustomer ? selectedCustomer.full_name : "Select a customer"}
                              </span>
                              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                              </span>
                            </Listbox.Button>

                            <Transition
                              as={Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {customers.map((customer) => (
                                  <Listbox.Option
                                    key={customer.id}
                                    className={({ active }) =>
                                      classNames(
                                        active ? "bg-indigo-600 text-white" : "text-gray-900",
                                        "relative cursor-default select-none py-2 pl-3 pr-9"
                                      )
                                    }
                                    value={customer}
                                  >
                                    {({ selected, active }) => (
                                      <>
                                        <span className={classNames(selected ? "font-semibold" : "font-normal", "block truncate")}>
                                          {customer.full_name}
                                        </span>
                                        {selected ? (
                                          <span
                                            className={classNames(
                                              active ? "text-white" : "text-indigo-600",
                                              "absolute inset-y-0 right-0 flex items-center pr-4"
                                            )}
                                          >
                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </Listbox>

                        <button
                          type="button"
                          onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                          className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          {showNewCustomerForm ? "Cancel new customer" : "Add new customer"}
                        </button>
                      </div>

                      {/* New Customer Form */}
                      {showNewCustomerForm && (
                        <div className="border-t border-gray-200 pt-4 space-y-4">
                          <div>
                            <label htmlFor="full-name" className="block text-sm font-medium leading-6 text-gray-900">
                              Full name
                            </label>
                            <div className="mt-2">
                              <input
                                type="text"
                                name="full-name"
                                id="full-name"
                                value={newCustomerName}
                                onChange={(e) => setNewCustomerName(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="John Doe"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
                              Phone number
                            </label>
                            <div className="mt-2">
                              <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={newCustomerPhone}
                                onChange={(e) => setNewCustomerPhone(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="+1 (555) 987-6543"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleCreateCustomer}
                            disabled={isLoading || !newCustomerName || !newCustomerPhone}
                            className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? "Creating..." : "Create Customer"}
                          </button>
                        </div>
                      )}

                      {/* Date Selection */}
                      <div>
                        <label htmlFor="date" className="block text-sm font-medium leading-6 text-gray-900">
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
                        <label htmlFor="time" className="block text-sm font-medium leading-6 text-gray-900">
                          Time
                        </label>
                        <div className="mt-2">
                          <select
                            id="time"
                            name="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
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
                        <label htmlFor="comment" className="block text-sm font-medium leading-6 text-gray-900">
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
                    disabled={isLoading}
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Creating..." : "Add Appointment"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}