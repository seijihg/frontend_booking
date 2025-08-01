"use client";

import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

interface ViewOption {
  value: string;
  label: string;
}

interface ViewDropdownProps {
  currentView: string;
  options: ViewOption[];
  onViewChange: (view: string) => void;
  buttonLabel?: string;
}

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function ViewDropdown({
  currentView,
  options,
  onViewChange,
  buttonLabel = "view",
}: ViewDropdownProps) {
  const currentOption = options.find((opt) => opt.value === currentView);

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        type="button"
        className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-0.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
      >
        {currentOption?.label || currentView} {buttonLabel}
        <ChevronDownIcon
          aria-hidden="true"
          className="-mr-2 h-8 w-8 text-gray-400"
        />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-3 w-36 origin-top-right overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {options.map((option) => (
              <Menu.Item key={option.value}>
                {({ active }) => (
                  <button
                    onClick={() => onViewChange(option.value)}
                    className={classNames(
                      active ? "bg-gray-100" : "",
                      currentView === option.value ? "font-semibold" : "",
                      "block w-full px-4 py-2 text-left text-sm text-gray-700"
                    )}
                  >
                    {option.label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
