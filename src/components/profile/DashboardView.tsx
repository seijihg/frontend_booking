"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Loader2,
  User,
  Calendar,
  Bell,
} from "lucide-react";
import { useGetSalon, useUpdateSalon } from "@/hooks/useSalon";
import { useUpdateUser } from "@/hooks/useUser";
import { useUserStore } from "@/stores/userStore";
import Alert from "@/components/common/Alert";

// Predefined reminder time options
const reminderOptions = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 1440, label: "1 day (24 hours)" },
];

export default function DashboardView() {
  // Get the salon ID from the user in global state
  const { user } = useUserStore();
  const salonId = user?.salons[0];

  // Get the salon data using the salon ID
  const {
    data: salonData,
    isLoading,
    isError,
    error,
  } = useGetSalon(salonId || 0, {
    enabled: !!salonId, // Only fetch if we have a salon ID
  });

  const salon = salonData;

  // SMS Reminder settings state
  const [reminderMinutes, setReminderMinutes] = useState<number>(60);
  const [isEditingReminder, setIsEditingReminder] = useState(false);
  const [alertState, setAlertState] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });

  // Address editing state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddress, setEditAddress] = useState({
    street: "",
    city: "",
    postal_code: "",
  });

  // Phone editing state
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editPhone, setEditPhone] = useState("");

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfile, setEditProfile] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
  });

  // Update salon mutation hook
  const updateSalonMutation = useUpdateSalon(salonId || 0);

  // Update user mutation hook
  const updateUserMutation = useUpdateUser(user?.id || 0);

  // Initialize reminder state when salon data loads
  useEffect(() => {
    if (salon?.reminder_time_minutes) {
      setReminderMinutes(salon.reminder_time_minutes);
    }
  }, [salon?.reminder_time_minutes]);

  // Initialize address form when salon data loads
  useEffect(() => {
    if (salon?.addresses?.[0]) {
      setEditAddress({
        street: salon.addresses[0].street || "",
        city: salon.addresses[0].city || "",
        postal_code: salon.addresses[0].postal_code || "",
      });
    }
  }, [salon?.addresses]);

  // Initialize phone form when salon data loads
  useEffect(() => {
    if (salon?.phone_number) {
      setEditPhone(salon.phone_number);
    }
  }, [salon?.phone_number]);

  // Initialize profile form when user data loads
  useEffect(() => {
    if (user) {
      setEditProfile({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
      });
    }
  }, [user]);

  // Handler to save reminder time
  const handleSaveReminder = async () => {
    try {
      await updateSalonMutation.mutateAsync({
        reminder_time_minutes: reminderMinutes,
      });
      setAlertState({
        show: true,
        type: "success",
        message: "SMS reminder time updated successfully!",
      });
      setIsEditingReminder(false);
    } catch (error) {
      setAlertState({
        show: true,
        type: "error",
        message: "Failed to update SMS reminder time.",
      });
    }
  };

  // Handler to cancel reminder editing
  const handleCancelEdit = () => {
    setReminderMinutes(salon?.reminder_time_minutes || 60);
    setIsEditingReminder(false);
  };

  // Handler to save address
  const handleSaveAddress = async () => {
    try {
      await updateSalonMutation.mutateAsync({
        addresses: [editAddress],
      });
      setAlertState({
        show: true,
        type: "success",
        message: "Business address updated successfully!",
      });
      setIsEditingAddress(false);
    } catch (error) {
      setAlertState({
        show: true,
        type: "error",
        message: "Failed to update business address.",
      });
    }
  };

  // Handler to cancel address editing
  const handleCancelAddress = () => {
    if (salon?.addresses?.[0]) {
      setEditAddress({
        street: salon.addresses[0].street || "",
        city: salon.addresses[0].city || "",
        postal_code: salon.addresses[0].postal_code || "",
      });
    }
    setIsEditingAddress(false);
  };

  // Handler to save phone
  const handleSavePhone = async () => {
    try {
      await updateSalonMutation.mutateAsync({
        phone_number: editPhone,
      });
      setAlertState({
        show: true,
        type: "success",
        message: "Contact information updated successfully!",
      });
      setIsEditingPhone(false);
    } catch (error) {
      setAlertState({
        show: true,
        type: "error",
        message: "Failed to update contact information.",
      });
    }
  };

  // Handler to cancel phone editing
  const handleCancelPhone = () => {
    setEditPhone(salon?.phone_number || "");
    setIsEditingPhone(false);
  };

  // Handler to save profile
  const handleSaveProfile = async () => {
    try {
      await updateUserMutation.mutateAsync({
        first_name: editProfile.first_name,
        last_name: editProfile.last_name,
        phone_number: editProfile.phone_number,
      });
      setAlertState({
        show: true,
        type: "success",
        message: "Profile updated successfully!",
      });
      setIsEditingProfile(false);
    } catch (error) {
      setAlertState({
        show: true,
        type: "error",
        message: "Failed to update profile.",
      });
    }
  };

  // Handler to cancel profile editing
  const handleCancelProfile = () => {
    if (user) {
      setEditProfile({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
      });
    }
    setIsEditingProfile(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-full bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">
            Loading business information...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="min-h-full bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">
              Error loading business information: {error?.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no salon ID or no salon data
  if (!salonId || !salon) {
    return (
      <div className="min-h-full bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              No Business Information
            </h2>
            <p className="text-sm text-gray-500">
              {!salonId
                ? "You are not associated with any salon. Please contact your administrator."
                : "Unable to load salon information. Please try again later."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Random business images for placeholder
  const businessImages = [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1559599101-f09722fb4948?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  ];

  // Select a random image based on salon ID
  const selectedImage = businessImages[salon.id % businessImages.length];

  // Render salon information
  return (
    <div className="min-h-full bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Card with Two Columns */}
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            {/* Left Column - Business Image (1/3 width) */}
            <div className="lg:col-span-1 h-full">
              <div className="aspect-square lg:aspect-auto lg:h-full relative">
                <img
                  src={selectedImage}
                  alt={`${salon.name} business`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h2 className="text-2xl font-bold mb-2">{salon.name}</h2>
                  <p className="text-sm opacity-90">
                    {user?.is_owner
                      ? "Business Owner"
                      : user?.is_staff
                      ? "Staff Member"
                      : "Customer"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Salon Information (2/3 width) */}
            <div className="lg:col-span-2 p-6 lg:p-8">
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                    Business Information
                  </h1>
                  <p className="text-sm text-gray-500">
                    Manage and view your salon details
                  </p>
                </div>

                {/* Address Section */}
                {salon.addresses && salon.addresses.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            Business Address
                            {salon.addresses.length > 1 ? "es" : ""}
                          </h3>
                          {!isEditingAddress && user?.is_owner && (
                            <button
                              type="button"
                              onClick={() => setIsEditingAddress(true)}
                              className="text-sm text-indigo-600 hover:text-indigo-500"
                            >
                              Edit
                            </button>
                          )}
                        </div>

                        {isEditingAddress ? (
                          <div className="space-y-4">
                            <div>
                              <label
                                htmlFor="street"
                                className="block text-sm text-gray-600 mb-1"
                              >
                                Street
                              </label>
                              <input
                                type="text"
                                id="street"
                                value={editAddress.street}
                                onChange={(e) =>
                                  setEditAddress({
                                    ...editAddress,
                                    street: e.target.value,
                                  })
                                }
                                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label
                                  htmlFor="city"
                                  className="block text-sm text-gray-600 mb-1"
                                >
                                  City
                                </label>
                                <input
                                  type="text"
                                  id="city"
                                  value={editAddress.city}
                                  onChange={(e) =>
                                    setEditAddress({
                                      ...editAddress,
                                      city: e.target.value,
                                    })
                                  }
                                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="postal_code"
                                  className="block text-sm text-gray-600 mb-1"
                                >
                                  Postal Code
                                </label>
                                <input
                                  type="text"
                                  id="postal_code"
                                  value={editAddress.postal_code}
                                  onChange={(e) =>
                                    setEditAddress({
                                      ...editAddress,
                                      postal_code: e.target.value,
                                    })
                                  }
                                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={handleSaveAddress}
                                disabled={updateSalonMutation.isPending}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updateSalonMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  "Save"
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelAddress}
                                disabled={updateSalonMutation.isPending}
                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {salon.addresses.map((address) => (
                              <address
                                key={address.id}
                                className="text-sm text-gray-600 not-italic mb-3"
                              >
                                <p>{address.street}</p>
                                <p>
                                  {address.city}, {address.postal_code}
                                </p>
                              </address>
                            ))}
                            {!user?.is_owner && (
                              <p className="mt-2 text-xs text-gray-500 italic">
                                Only business owners can edit this information.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Phone Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          Contact Information
                        </h3>
                        {!isEditingPhone && user?.is_owner && (
                          <button
                            type="button"
                            onClick={() => setIsEditingPhone(true)}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      {isEditingPhone ? (
                        <div className="space-y-4">
                          <div>
                            <label
                              htmlFor="phone"
                              className="block text-sm text-gray-600 mb-1"
                            >
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              id="phone"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              placeholder="+447123456789"
                              className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                            />
                          </div>

                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={handleSavePhone}
                              disabled={updateSalonMutation.isPending}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updateSalonMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                "Save"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelPhone}
                              disabled={updateSalonMutation.isPending}
                              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          <p>{salon.phone_number}</p>
                          {!user?.is_owner && (
                            <p className="mt-2 text-xs text-gray-500 italic">
                              Only business owners can edit this information.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SMS Reminder Settings Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          SMS Reminder Settings
                        </h3>
                        {!isEditingReminder && user?.is_owner && (
                          <button
                            type="button"
                            onClick={() => setIsEditingReminder(true)}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      {isEditingReminder ? (
                        <div className="space-y-4">
                          <div>
                            <label
                              htmlFor="reminder-time"
                              className="block text-sm text-gray-600 mb-2"
                            >
                              Send reminder SMS to customers before their
                              appointment:
                            </label>
                            <select
                              id="reminder-time"
                              value={reminderMinutes}
                              onChange={(e) =>
                                setReminderMinutes(Number(e.target.value))
                              }
                              className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            >
                              {reminderOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={handleSaveReminder}
                              disabled={updateSalonMutation.isPending}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updateSalonMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                "Save"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={updateSalonMutation.isPending}
                              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          <p>
                            Customers receive SMS reminders{" "}
                            <span className="font-medium">
                              {reminderOptions.find(
                                (opt) =>
                                  opt.value === salon?.reminder_time_minutes
                              )?.label ||
                                `${salon?.reminder_time_minutes} minutes`}
                            </span>{" "}
                            before their appointment.
                          </p>
                          {!user?.is_owner && (
                            <p className="mt-2 text-xs text-gray-500 italic">
                              Only business owners can change this setting.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Information */}
                {user && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            Your Profile
                          </h3>
                          {!isEditingProfile && (
                            <button
                              type="button"
                              onClick={() => setIsEditingProfile(true)}
                              className="text-sm text-indigo-600 hover:text-indigo-500"
                            >
                              Edit
                            </button>
                          )}
                        </div>

                        {isEditingProfile ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label
                                  htmlFor="first_name"
                                  className="block text-sm text-gray-600 mb-1"
                                >
                                  First Name
                                </label>
                                <input
                                  type="text"
                                  id="first_name"
                                  value={editProfile.first_name}
                                  onChange={(e) =>
                                    setEditProfile({
                                      ...editProfile,
                                      first_name: e.target.value,
                                    })
                                  }
                                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="last_name"
                                  className="block text-sm text-gray-600 mb-1"
                                >
                                  Last Name
                                </label>
                                <input
                                  type="text"
                                  id="last_name"
                                  value={editProfile.last_name}
                                  onChange={(e) =>
                                    setEditProfile({
                                      ...editProfile,
                                      last_name: e.target.value,
                                    })
                                  }
                                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <label
                                htmlFor="user_phone"
                                className="block text-sm text-gray-600 mb-1"
                              >
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                id="user_phone"
                                value={editProfile.phone_number}
                                onChange={(e) =>
                                  setEditProfile({
                                    ...editProfile,
                                    phone_number: e.target.value,
                                  })
                                }
                                placeholder="+447123456789"
                                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Email
                              </label>
                              <p className="text-sm text-gray-500 italic py-2">
                                {user.email} (cannot be changed)
                              </p>
                            </div>

                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={handleSaveProfile}
                                disabled={updateUserMutation.isPending}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updateUserMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  "Save"
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelProfile}
                                disabled={updateUserMutation.isPending}
                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <span className="font-medium">Name:</span>{" "}
                              {user.first_name} {user.last_name}
                            </p>
                            <p>
                              <span className="font-medium">Email:</span>{" "}
                              {user.email}
                            </p>
                            <p>
                              <span className="font-medium">Phone:</span>{" "}
                              {user.phone_number}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Salon Metadata */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Additional Information
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Salon ID:</span>{" "}
                          {salon.id}
                        </p>
                        <p>
                          <span className="font-medium">Created:</span>{" "}
                          {new Date(salon.created).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p>
                          <span className="font-medium">Last Updated:</span>{" "}
                          {new Date(salon.modified).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Alert for feedback */}
        {alertState.show && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <Alert
              show={alertState.show}
              type={alertState.type}
              message={alertState.message}
              onDismiss={() =>
                setAlertState({ show: false, type: "success", message: "" })
              }
              autoHideDuration={5000}
            />
          </div>
        )}
      </div>
    </div>
  );
}
