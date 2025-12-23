# Design: Customers Tab (CustomersView Component)

## Overview

Add a new "Customers" tab to the main navigation that displays a dedicated customer management view. This will be a separate component (`CustomersView.tsx`) accessible via the navigation bar, following the existing tab-based architecture.

## Requirements

1. Add "Customers" as a new navigation tab (after Calendar)
2. Create a dedicated `CustomersView` component
3. Display a list of customers with columns: Full Name, Phone Number, Actions (Edit/Delete)
4. Edit button triggers inline editing for both Full Name and Phone Number
5. Delete button removes the customer with confirmation
6. Only visible to owners (`is_owner: true`)
7. Use salon-filtered customer fetching for efficiency

---

## Current Architecture

### Navigation System

The app uses a tab-based navigation controlled by `MainComponent.tsx`:

**File: `src/components/dashboard/MainComponent.tsx`**
```typescript
type ViewType = "dashboard" | "calendar" | "team" | "projects";

// Switch statement renders different views based on currentView
```

**File: `src/components/dashboard/navigation_bar/NavBar.tsx`**
- Renders navigation tabs based on `ViewType`
- Currently shows: Dashboard, Calendar

### Existing Views

| View | Component | Location |
|------|-----------|----------|
| Dashboard | `DashboardView` | `src/components/profile/DashboardView.tsx` |
| Calendar | `CalendarView` | `src/components/calendar/CalendarView.tsx` |
| Team | Placeholder | Coming soon |
| Projects | Placeholder | Coming soon |

---

## Implementation Plan

### Phase 0: Fix Customer Type Definition (COMPLETED)

**File: `src/types/customer.ts`** - Updated to match API:

```typescript
import { Salon } from "./salon";

export interface Customer {
  id: number;
  full_name: string;
  phone_number: string;
  salons: Salon[];
  created: string;
  modified: string;
}

export interface CreateCustomerRequest {
  full_name?: string;
  phone_number: string;
  salon_ids: number[];
}

export interface UpdateCustomerRequest {
  full_name?: string;
  phone_number?: string;
  salon_ids?: number[];
}
```

---

### Phase 1: API and Hook Updates (COMPLETED)

**File: `src/api/customerApi.ts`** - Functions available:
- `getCustomers(salonId?)` - Fetch customers with optional salon filter
- `getCustomer(customerId)` - Fetch single customer
- `createCustomer(data)` - Create new customer
- `updateCustomer(customerId, data)` - Update customer
- `deleteCustomer(customerId)` - Delete customer

**File: `src/hooks/useCustomers.ts`** - Hooks available:
- `useCustomers(salonId?)` - Query hook with optional salon filter
- `useCustomer(customerId)` - Query hook for single customer
- `useCreateCustomer()` - Mutation hook for creating
- `useUpdateCustomer()` - Mutation hook for updating
- `useDeleteCustomer()` - Mutation hook for deleting

---

### Phase 2: Add Customers Tab to Navigation (COMPLETED)

#### 2.1 Update ViewType

**File: `src/components/dashboard/MainComponent.tsx`**

```typescript
type ViewType = "dashboard" | "calendar" | "customers" | "team" | "projects";
```

#### 2.2 Update Navigation Array

**File: `src/components/dashboard/navigation_bar/NavBar.tsx`**

```typescript
const navigation = [
  {
    name: "Dashboard",
    view: "dashboard" as ViewType,
    current: currentView === "dashboard",
  },
  {
    name: "Calendar",
    view: "calendar" as ViewType,
    current: currentView === "calendar",
  },
  {
    name: "Customers",
    view: "customers" as ViewType,
    current: currentView === "customers",
    requiresStaffOrOwner: true, // Only show for owners or staff
  },
];

// Filter navigation items based on user role
const visibleNavigation = navigation.filter(
  (item) => !item.requiresStaffOrOwner || user?.is_owner || user?.is_staff
);
```

#### 2.3 Add Case for CustomersView

**File: `src/components/dashboard/MainComponent.tsx`**

```typescript
import CustomersView from "@/components/customers/CustomersView";

const renderContent = () => {
  switch (currentView) {
    case "dashboard":
      return <DashboardView />;
    case "calendar":
      return <CalendarView />;
    case "customers":
      return <CustomersView />;
    case "team":
      return (
        <div className="p-8 text-gray-500">Team view coming soon...</div>
      );
    case "projects":
      return (
        <div className="p-8 text-gray-500">Projects view coming soon...</div>
      );
    default:
      return <DashboardView />;
  }
};
```

---

### Phase 3: Create CustomersView Component (COMPLETED)

**File: `src/components/customers/CustomersView.tsx`**

```typescript
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
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
  const [editCustomerData, setEditCustomerData] = useState({
    full_name: "",
    phone_number: "",
  });
  const [deletingCustomerId, setDeletingCustomerId] = useState<number | null>(null);

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
    } catch (error) {
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
    } catch (error) {
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
                Manage your salon's customer list
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
                            Delete "{customer.full_name || customer.phone_number}"?
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
```

---

## Visual Design

### Customers Tab Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Dashboard]  [Calendar]  [Customers]                          🔔  [Avatar] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  👥 Customers                                                                │
│  Manage your salon's customer list                                          │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ FULL NAME              │ PHONE NUMBER         │ ACTIONS                │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │ Jane Customer          │ +447111222333        │      Edit    Delete    │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │ [________________]     │ [________________]   │   [Save]  [Cancel]     │ │
│  │ (Editing Mode)         │ (Editing Mode)       │                        │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │ Delete "John Smith"?                          │  [Confirm]  [Cancel]   │ │
│  │ (Delete Confirmation)                         │                        │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │ John Smith             │ +447987654321        │      Edit    Delete    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Row Modes

**View Mode (Default)**:
- Displays customer data in table cells
- Edit and Delete action buttons

**Edit Mode (Inline)**:
- Row transforms to show input fields
- Full Name input (text)
- Phone Number input (tel)
- Save/Cancel buttons replace Edit/Delete buttons

**Delete Confirmation Mode**:
- Row shows confirmation message with customer name
- Confirm/Cancel buttons replace Edit/Delete buttons
- Confirm button is red to indicate destructive action

---

## Access Control

| User Role | Can See Tab | Can View List | Can Edit | Can Delete |
|-----------|-------------|---------------|----------|------------|
| Owner (`is_owner: true`) | Yes | Yes | Yes | Yes |
| Staff (`is_staff: true`) | Yes | Yes | Yes | Yes |
| Regular User | No | No | No | No |

**Access Logic**: Users with `is_owner: true` OR `is_staff: true` can access the Customers tab and all its functionality.

---

## Implementation Checklist

### Phase 0: Fix Customer Type (COMPLETED)
- [x] Update `src/types/customer.ts` to match API response
- [x] Add `CreateCustomerRequest` interface
- [x] Add `UpdateCustomerRequest` interface

### Phase 1: API & Hooks (COMPLETED)
- [x] Update `getCustomers` function to support optional `salonId` parameter
- [x] Add `updateCustomer` function to `src/api/customerApi.ts`
- [x] Add `deleteCustomer` function to `src/api/customerApi.ts`
- [x] Update `useCustomers` hook to accept optional `salonId` parameter
- [x] Add `useUpdateCustomer` hook
- [x] Add `useDeleteCustomer` hook

### Phase 2: Add Customers Tab (COMPLETED)
- [x] Update `ViewType` in `MainComponent.tsx` to include `"customers"`
- [x] Add "Customers" navigation item in `NavBar.tsx` (owner OR staff)
- [x] Add case for `CustomersView` in `MainComponent.tsx` switch statement
- [x] Import `CustomersView` component

### Phase 3: Create CustomersView Component (COMPLETED)
- [x] Create `src/components/customers/CustomersView.tsx`
- [x] Implement access control (owner OR staff)
- [x] Implement loading state
- [x] Implement error state
- [x] Implement empty state
- [x] Implement customer table with view mode
- [x] Implement inline edit mode
- [x] Implement delete confirmation mode
- [x] Add alert feedback for success/error

### Phase 4: Testing
- [ ] Test Customers tab visible to owners and staff only
- [ ] Test customer list displays correctly (filtered by salon)
- [ ] Test Edit button triggers edit mode
- [ ] Test inline editing for Full Name
- [ ] Test inline editing for Phone Number
- [ ] Test Save updates the customer
- [ ] Test Cancel reverts edit changes
- [ ] Test Delete button triggers confirmation mode
- [ ] Test Confirm deletes the customer
- [ ] Test Cancel reverts delete confirmation
- [ ] Test success/error alerts

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/types/customer.ts` | COMPLETED - Updated interface to match API |
| `src/api/customerApi.ts` | COMPLETED - Added update/delete functions |
| `src/hooks/useCustomers.ts` | COMPLETED - Added update/delete hooks |
| `src/components/dashboard/MainComponent.tsx` | COMPLETED - Updated ViewType, added CustomersView case |
| `src/components/dashboard/navigation_bar/NavBar.tsx` | COMPLETED - Added Customers nav item (owner-only) |
| `src/components/customers/CustomersView.tsx` | COMPLETED - Created customer management component |

---

## Dependencies

- `lucide-react` - Already installed (needs `Users` and `Loader2` icons)
- `@tanstack/react-query` - Already installed
- `useCustomers` hook - COMPLETED
- `useUpdateCustomer` hook - COMPLETED
- `useDeleteCustomer` hook - COMPLETED
- `Customer` type - COMPLETED
- `Alert` component - Already exists

---

## API Reference Summary

Based on `docs/FRONTEND_API.md`:

| Operation | Endpoint | Method | Notes |
|-----------|----------|--------|-------|
| List Customers | `/customers/?salon={id}` | GET | Optional salon filter |
| Get Customer | `/customers/{id}/` | GET | Single customer |
| Create Customer | `/customers/` | POST | Requires `salon_ids[]` |
| Update Customer | `/customers/{id}/` | PATCH | Partial update supported |
| Delete Customer | `/customers/{id}/` | DELETE | Returns 204 No Content |

### Customer Data Model

| Field | Type | Read | Write | Description |
|-------|------|------|-------|-------------|
| `id` | int | Yes | No | Primary key |
| `full_name` | string | Yes | Yes | Customer's name |
| `phone_number` | string | Yes | Yes | E.164 format (e.g., +447111222333) |
| `salons` | Salon[] | Yes | No | Nested salon objects |
| `salon_ids` | int[] | No | Yes | Array of salon IDs (for create/update) |
| `created` | datetime | Yes | No | ISO 8601 timestamp |
| `modified` | datetime | Yes | No | ISO 8601 timestamp |

---

## Related Documentation

- Backend API: `docs/FRONTEND_API.md` (Customers section)
- Customer types: `src/types/customer.ts`
- Customer API: `src/api/customerApi.ts`
- Customer hooks: `src/hooks/useCustomers.ts`
- Navigation: `src/components/dashboard/navigation_bar/NavBar.tsx`
- Main component: `src/components/dashboard/MainComponent.tsx`
