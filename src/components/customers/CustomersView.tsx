"use client";

import { useState } from "react";
import { Users, Loader2 } from "lucide-react";
import {
  useCustomers,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/hooks/useCustomers";
import { useUserStore } from "@/stores/userStore";
import Alert from "@/components/common/Alert";
import { Customer } from "@/types/customer";

export default function CustomersView() {
  const { user } = useUserStore();
  const salonId = user?.salons[0];

  // Customer editing state
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(
    null
  );
  const [editCustomerData, setEditCustomerData] = useState({
    full_name: "",
    phone_number: "",
  });
  const [deletingCustomerId, setDeletingCustomerId] = useState<number | null>(
    null
  );

  // Alert state
  const [alertState, setAlertState] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });

  // Fetch customers filtered by salon
  const {
    data: customers,
    isLoading,
    isError,
    error,
  } = useCustomers(salonId);

  // Mutations
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();

  // Handler functions
  const handleStartEditCustomer = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setEditCustomerData({
      full_name: customer.full_name || "",
      phone_number: customer.phone_number || "",
    });
  };

  const handleCancelEditCustomer = () => {
    setEditingCustomerId(null);
    setEditCustomerData({ full_name: "", phone_number: "" });
  };

  const handleSaveCustomer = async () => {
    if (!editingCustomerId) return;

    try {
      await updateCustomerMutation.mutateAsync({
        customerId: editingCustomerId,
        data: editCustomerData,
      });
      setAlertState({
        show: true,
        type: "success",
        message: "Customer updated successfully!",
      });
      setEditingCustomerId(null);
      setEditCustomerData({ full_name: "", phone_number: "" });
    } catch {
      setAlertState({
        show: true,
        type: "error",
        message: "Failed to update customer.",
      });
    }
  };

  const handleDeleteCustomer = (customerId: number) => {
    setDeletingCustomerId(customerId);
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!deletingCustomerId) return;

    try {
      await deleteCustomerMutation.mutateAsync(deletingCustomerId);
      setAlertState({
        show: true,
        type: "success",
        message: "Customer deleted successfully!",
      });
      setDeletingCustomerId(null);
    } catch {
      setAlertState({
        show: true,
        type: "error",
        message: "Failed to delete customer.",
      });
      setDeletingCustomerId(null);
    }
  };

  const handleCancelDeleteCustomer = () => {
    setDeletingCustomerId(null);
  };

  // Access control - only owners or staff can view
  if (!user?.is_owner && !user?.is_staff) {
    return (
      <div className="min-h-full bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Access Restricted
            </h2>
            <p className="text-sm text-gray-500">
              Only business owners and staff can access customer management.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-full bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading customers...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-full bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">
              Error loading customers: {error?.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Customers
              </h1>
              <p className="text-sm text-gray-500">
                Manage your salon&apos;s customer list
              </p>
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
          {customers && customers.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Full Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Phone Number
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer: Customer) => (
                  <tr key={customer.id}>
                    {editingCustomerId === customer.id ? (
                      <>
                        {/* Edit Mode */}
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editCustomerData.full_name}
                            onChange={(e) =>
                              setEditCustomerData({
                                ...editCustomerData,
                                full_name: e.target.value,
                              })
                            }
                            className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                            placeholder="Full Name"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="tel"
                            value={editCustomerData.phone_number}
                            onChange={(e) =>
                              setEditCustomerData({
                                ...editCustomerData,
                                phone_number: e.target.value,
                              })
                            }
                            className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                            placeholder="+447123456789"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleSaveCustomer}
                              disabled={updateCustomerMutation.isPending}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {updateCustomerMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Save"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditCustomer}
                              disabled={updateCustomerMutation.isPending}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : deletingCustomerId === customer.id ? (
                      <>
                        {/* Delete Confirmation Mode */}
                        <td className="px-6 py-4 text-sm text-gray-900" colSpan={2}>
                          <span className="text-red-600 font-medium">
                            Delete &quot;{customer.full_name || customer.phone_number}&quot;?
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleConfirmDeleteCustomer}
                              disabled={deleteCustomerMutation.isPending}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                              {deleteCustomerMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Confirm"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelDeleteCustomer}
                              disabled={deleteCustomerMutation.isPending}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* View Mode */}
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {customer.full_name || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {customer.phone_number || "-"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-4">
                            <button
                              type="button"
                              onClick={() => handleStartEditCustomer(customer)}
                              className="text-sm text-indigo-600 hover:text-indigo-500"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-sm text-red-600 hover:text-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Customers
              </h3>
              <p className="text-sm text-gray-500">
                No customers found for this salon. Customers will appear here
                when they book appointments.
              </p>
            </div>
          )}
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
