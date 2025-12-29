import { Fragment, useState, useEffect, useMemo, useRef } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon, PlusIcon } from "@heroicons/react/20/solid";
import { Customer } from "@/types/customer";

interface CustomerSearchSelectProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onCustomerChange: (customer: Customer | null) => void;
  isLoading?: boolean;
  label?: string;
  placeholder?: string;
  /** Callback when user clicks "Add new customer" - receives the search query */
  onAddNewCustomer?: (searchQuery: string) => void;
  /** Show add option even when no query is entered */
  showAddOption?: boolean;
}

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function CustomerSearchSelect({
  customers,
  selectedCustomer,
  onCustomerChange,
  isLoading = false,
  label = "Customer",
  placeholder = "Search for a customer...",
  onAddNewCustomer,
  showAddOption = false,
}: CustomerSearchSelectProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Filter customers based on debounced search query
  const filteredCustomers = useMemo(() => {
    if (debouncedQuery === "") {
      return customers;
    }
    
    return customers.filter((customer) =>
      customer.full_name
        .toLowerCase()
        .includes(debouncedQuery.toLowerCase())
    );
  }, [customers, debouncedQuery]);

  // Reset query when selected customer changes externally
  useEffect(() => {
    if (selectedCustomer) {
      setQuery("");
    }
  }, [selectedCustomer]);

  // Handler for add new customer button - closes dropdown and calls callback
  const handleAddNewCustomer = (searchQuery: string) => {
    // Close the dropdown by clicking the button (toggles closed)
    buttonRef.current?.click();
    // Call the callback
    onAddNewCustomer?.(searchQuery);
  };

  return (
    <Combobox value={selectedCustomer} onChange={onCustomerChange} nullable>
      <Combobox.Label className="block text-sm font-medium leading-6 text-gray-900">
        {label}
      </Combobox.Label>
      <div className="relative mt-2">
        <div className="relative w-full cursor-default overflow-hidden rounded-md bg-white text-left shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:text-sm">
          <Combobox.Input
            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
            displayValue={(customer: Customer | null) =>
              customer?.full_name || ""
            }
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />
          <Combobox.Button
              ref={buttonRef}
              className="absolute inset-y-0 right-0 flex items-center pr-2"
            >
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </Combobox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery("")}
        >
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {isLoading ? (
              <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                Loading customers...
              </div>
            ) : query !== "" && debouncedQuery === "" ? (
              <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                Searching...
              </div>
            ) : filteredCustomers.length === 0 && debouncedQuery !== "" ? (
              <div className="py-2">
                <div className="px-4 py-2 text-sm text-gray-500">
                  No customers found.
                </div>
                {onAddNewCustomer && (
                  <button
                    type="button"
                    onClick={() => handleAddNewCustomer(debouncedQuery.trim())}
                    className="w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>
                      Add &ldquo;<span className="font-medium">{debouncedQuery.trim()}</span>&rdquo; as new customer
                    </span>
                  </button>
                )}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-2">
                <div className="px-4 py-2 text-sm text-gray-500">
                  No customers available.
                </div>
                {onAddNewCustomer && showAddOption && (
                  <button
                    type="button"
                    onClick={() => handleAddNewCustomer("")}
                    className="w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Add new customer</span>
                  </button>
                )}
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <Combobox.Option
                  key={customer.id}
                  className={({ active }) =>
                    classNames(
                      "relative cursor-default select-none py-2 pl-10 pr-4",
                      active ? "bg-indigo-600 text-white" : "text-gray-900"
                    )
                  }
                  value={customer}
                >
                  {({ selected, active }) => (
                    <>
                      <span
                        className={classNames(
                          "block truncate",
                          selected ? "font-medium" : "font-normal"
                        )}
                      >
                        {customer.full_name}
                      </span>
                      {customer.phone_number && (
                        <span
                          className={classNames(
                            "block truncate text-sm",
                            active ? "text-indigo-200" : "text-gray-500"
                          )}
                        >
                          {customer.phone_number}
                        </span>
                      )}
                      {selected ? (
                        <span
                          className={classNames(
                            "absolute inset-y-0 left-0 flex items-center pl-3",
                            active ? "text-white" : "text-indigo-600"
                          )}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}