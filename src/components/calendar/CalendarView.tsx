"use client";

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/20/solid";
import { Menu } from "@headlessui/react";
import { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useAppointmentStore } from "@/stores/appointmentStore";
import DayViewWithSlots from "./DayViewWithSlots";
import { getBookings } from "@/api/bookingApi";

// Extend dayjs with UTC plugin
dayjs.extend(utc);

type ViewType = "day" | "week" | "month" | "year";

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
}

interface BookingData {
  id: number;
  created: string;
  modified: string;
  appointment_time: string;
  comment: string;
  task_id: string;
  salon: number;
  user: number;
  customer: number;
}

export default function CalendarView() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [currentView, setCurrentView] = useState<ViewType>("day");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setAppointmentFormOpen } = useAppointmentStore();

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        const bookings: BookingData[] = await getBookings();
        
        // Transform booking data to appointment format
        const transformedAppointments: Appointment[] = bookings.map(booking => {
          // Parse as UTC and keep in UTC (don't convert to local time)
          const appointmentDate = dayjs.utc(booking.appointment_time);
          const startTime = appointmentDate.format('HH:mm');
          // Assume 1 hour duration for now
          const endTime = appointmentDate.add(1, 'hour').format('HH:mm');
          
          console.log(`Booking ${booking.id}: UTC time ${booking.appointment_time} -> ${startTime}`);
          
          return {
            id: booking.id.toString(),
            date: appointmentDate.format('YYYY-MM-DD'),
            startTime: startTime,
            endTime: endTime,
            title: booking.comment || `Appointment #${booking.id}`,
          };
        });
        
        setAppointments(transformedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Generate calendar days for mini calendar
  const calendarDays = useMemo(() => {
    const startOfMonth = selectedDate.startOf("month");
    const endOfMonth = selectedDate.endOf("month");
    const startDate = startOfMonth.startOf("week");
    const endDate = endOfMonth.endOf("week");

    const days = [];
    let currentDate = startDate;

    while (
      currentDate.isBefore(endDate) ||
      currentDate.isSame(endDate, "day")
    ) {
      days.push({
        date: currentDate.format("YYYY-MM-DD"),
        isCurrentMonth: currentDate.month() === selectedDate.month(),
        isToday: currentDate.isSame(dayjs(), "day"),
        isSelected: currentDate.isSame(selectedDate, "day"),
      });
      currentDate = currentDate.add(1, "day");
    }

    return days;
  }, [selectedDate]);

  const formattedDate = useMemo(() => {
    return {
      short: selectedDate.format("MMM D, YYYY"),
      long: selectedDate.format("MMMM D, YYYY"),
      dayOfWeek: selectedDate.format("dddd"),
    };
  }, [selectedDate]);

  const handlePreviousDay = () => {
    setSelectedDate(selectedDate.subtract(1, "day"));
  };

  const handleNextDay = () => {
    setSelectedDate(selectedDate.add(1, "day"));
  };

  const handleToday = () => {
    setSelectedDate(dayjs());
  };

  const handleAddEvent = () => {
    setAppointmentFormOpen(true);
  };

  // Filter appointments for selected date
  const dailyAppointments = useMemo(() => {
    const selectedDateStr = selectedDate.format('YYYY-MM-DD');
    return appointments.filter(apt => apt.date === selectedDateStr);
  }, [appointments, selectedDate]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-none items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h1 className="text-base font-semibold text-gray-900">
            <time
              dateTime={selectedDate.format("YYYY-MM-DD")}
              className="sm:hidden"
            >
              {formattedDate.short}
            </time>
            <time
              dateTime={selectedDate.format("YYYY-MM-DD")}
              className="hidden sm:inline"
            >
              {formattedDate.long}
            </time>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {formattedDate.dayOfWeek}
          </p>
        </div>
        <div className="flex items-center">
          <div className="relative flex items-center rounded-md bg-white shadow-sm md:items-stretch">
            <button
              type="button"
              onClick={handlePreviousDay}
              className="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50"
            >
              <span className="sr-only">Previous day</span>
              <ChevronLeftIcon aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block"
            >
              Today
            </button>
            <span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden" />
            <button
              type="button"
              onClick={handleNextDay}
              className="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50"
            >
              <span className="sr-only">Next day</span>
              <ChevronRightIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="hidden md:ml-4 md:flex md:items-center">
            <Menu as="div" className="relative">
              <Menu.Button
                type="button"
                className="flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
              >
                {currentView.charAt(0).toUpperCase() + currentView.slice(1)}{" "}
                view
                <ChevronDownIcon
                  aria-hidden="true"
                  className="-mr-1 size-5 text-gray-400"
                />
              </Menu.Button>

              <Menu.Items className="absolute right-0 z-10 mt-3 w-36 origin-top-right overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    <button
                      onClick={() => setCurrentView("day")}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Day view
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button
                      onClick={() => setCurrentView("week")}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Week view
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button
                      onClick={() => setCurrentView("month")}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Month view
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button
                      onClick={() => setCurrentView("year")}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Year view
                    </button>
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Menu>
            <div className="ml-6 h-6 w-px bg-gray-300" />
            <button
              type="button"
              onClick={handleAddEvent}
              className="ml-6 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Add appointment
            </button>
          </div>
          <div className="ml-6 md:hidden">
            <Menu as="div" className="relative">
              <Menu.Button className="relative flex items-center rounded-full border border-transparent text-gray-400 outline-offset-8 hover:text-gray-500">
                <span className="absolute -inset-2" />
                <span className="sr-only">Open menu</span>
                <EllipsisHorizontalIcon aria-hidden="true" className="size-5" />
              </Menu.Button>

              <Menu.Items className="absolute right-0 z-10 mt-3 w-36 origin-top-right divide-y divide-gray-100 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    <button
                      onClick={handleAddEvent}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Create appointment
                    </button>
                  </Menu.Item>
                </div>
                <div className="py-1">
                  <Menu.Item>
                    <button
                      onClick={handleToday}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Go to today
                    </button>
                  </Menu.Item>
                </div>
                <div className="py-1">
                  {(["day", "week", "month", "year"] as ViewType[]).map(
                    (view) => (
                      <Menu.Item key={view}>
                        <button
                          onClick={() => setCurrentView(view)}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {view.charAt(0).toUpperCase() + view.slice(1)} view
                        </button>
                      </Menu.Item>
                    )
                  )}
                </div>
              </Menu.Items>
            </Menu>
          </div>
        </div>
      </header>
      <div className="isolate flex flex-auto overflow-hidden bg-white">
        <div className="flex flex-auto flex-col overflow-auto">
          {/* Mobile date selector */}
          <div className="sticky top-0 z-10 grid flex-none grid-cols-7 bg-white text-xs text-gray-500 shadow-sm ring-1 ring-black/5 md:hidden">
            {/* This would be dynamically generated based on the selected week */}
            <button
              type="button"
              className="flex flex-col items-center pt-3 pb-1.5"
            >
              <span>W</span>
              <span className="mt-3 flex size-8 items-center justify-center rounded-full text-base font-semibold text-gray-900">
                19
              </span>
            </button>
            {/* ... other days */}
          </div>

          {/* Main calendar content */}
          <div className="flex w-full flex-auto">
            <div className="w-14 flex-none bg-white ring-1 ring-gray-100" />
            <div className="flex-auto">
              {currentView === "day" && (
                <DayViewWithSlots
                  appointments={dailyAppointments}
                  selectedDate={selectedDate.format("YYYY-MM-DD")}
                />
              )}
              {currentView === "week" && (
                <div className="p-4 text-gray-500">
                  Week view coming soon...
                </div>
              )}
              {currentView === "month" && (
                <div className="p-4 text-gray-500">
                  Month view coming soon...
                </div>
              )}
              {currentView === "year" && (
                <div className="p-4 text-gray-500">
                  Year view coming soon...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mini calendar on the right */}
        <div className="hidden w-1/2 max-w-md flex-none border-l border-gray-100 px-8 py-10 md:block">
          <div className="flex items-center text-center text-gray-900">
            <button
              type="button"
              onClick={() => setSelectedDate(selectedDate.subtract(1, "month"))}
              className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Previous month</span>
              <ChevronLeftIcon aria-hidden="true" className="size-5" />
            </button>
            <div className="flex-auto text-sm font-semibold">
              {selectedDate.format("MMMM YYYY")}
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(selectedDate.add(1, "month"))}
              className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Next month</span>
              <ChevronRightIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="mt-6 grid grid-cols-7 text-center text-xs/6 text-gray-500">
            <div>M</div>
            <div>T</div>
            <div>W</div>
            <div>T</div>
            <div>F</div>
            <div>S</div>
            <div>S</div>
          </div>
          <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow-sm ring-1 ring-gray-200">
            {calendarDays.map((day, dayIdx) => (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDate(dayjs(day.date))}
                className={classNames(
                  "py-1.5 hover:bg-gray-100 focus:z-10",
                  day.isCurrentMonth ? "bg-white" : "bg-gray-50",
                  day.isSelected && day.isCurrentMonth && "font-semibold",
                  !day.isSelected &&
                    !day.isCurrentMonth &&
                    !day.isToday &&
                    "text-gray-400",
                  !day.isSelected &&
                    day.isToday &&
                    "text-indigo-600 font-semibold",
                  dayIdx === 0 && "rounded-tl-lg",
                  dayIdx === 6 && "rounded-tr-lg",
                  dayIdx === calendarDays.length - 7 && "rounded-bl-lg",
                  dayIdx === calendarDays.length - 1 && "rounded-br-lg"
                )}
              >
                <time
                  dateTime={day.date}
                  className={classNames(
                    "mx-auto flex h-7 w-7 items-center justify-center rounded-full",
                    day.isSelected && "bg-indigo-600 text-white"
                  )}
                >
                  {day.date.split("-").pop()?.replace(/^0/, "")}
                </time>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
