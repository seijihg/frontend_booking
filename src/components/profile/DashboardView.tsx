"use client";

import { Building2, MapPin, Phone, Loader2 } from "lucide-react";
import { useGetSalons } from "@/hooks/useSalon";

export default function DashboardView() {
  // Get the first salon from the list (you might want to add logic to select a specific salon)
  const { data: salonsData, isLoading, isError, error } = useGetSalons({
    page: 1,
    pageSize: 1, // Just get the first salon for now
  });

  const salon = salonsData?.results?.[0];

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-full bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading business information...</p>
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
            <p className="text-red-800">Error loading business information: {error?.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no salon
  if (!salon) {
    return (
      <div className="min-h-full bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">No Business Information</h2>
            <p className="text-sm text-gray-500">
              No salon information has been set up yet. Please create a salon to display business information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render salon information
  return (
    <div className="min-h-full bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Card */}
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
          {/* Company Header Section */}
          <div className="px-6 py-8 sm:px-8 lg:px-10">
            {/* Company Logo Placeholder */}
            <div className="mb-8 h-16 w-48 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-500 text-sm">Logo</span>
            </div>

            {/* Business Information */}
            <div className="space-y-6">
              {/* Company Name */}
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-gray-400" />
                  {salon.name}
                </h1>
              </div>

              {/* Address Section */}
              {salon.addresses && salon.addresses.length > 0 && (
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h2 className="text-sm font-medium text-gray-900 mb-2">
                        Business Address{salon.addresses.length > 1 ? 'es' : ''}
                      </h2>
                      {salon.addresses.map((address, index) => (
                        <address key={address.id} className="text-sm text-gray-600 not-italic mb-3">
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
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h2 className="text-sm font-medium text-gray-900 mb-2">
                      Telephone
                    </h2>
                    <p className="text-sm text-gray-600">
                      {salon.phone_number}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="bg-gray-50 px-6 py-4 sm:px-8 lg:px-10 rounded-b-lg">
            <p className="text-xs text-gray-500">
              Last updated: {salon.modified ? new Date(salon.modified).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}