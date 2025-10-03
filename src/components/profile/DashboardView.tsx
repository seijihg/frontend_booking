"use client";

import {
  Building2,
  MapPin,
  Phone,
  Loader2,
  User,
  Calendar,
} from "lucide-react";
import { useGetSalon } from "@/hooks/useSalon";
import { useUserStore } from "@/stores/userStore";

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
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                          Business Address
                          {salon.addresses.length > 1 ? "es" : ""}
                        </h3>
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
                      </div>
                    </div>
                  </div>
                )}

                {/* Phone Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Contact Information
                      </h3>
                      <p className="text-sm text-gray-600">
                        {salon.phone_number}
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                {user && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                          Your Profile
                        </h3>
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

                {/* Action Buttons */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Edit Information
                    </button>
                    <button className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      View Reports
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
