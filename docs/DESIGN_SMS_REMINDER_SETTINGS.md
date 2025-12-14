# Design: SMS Reminder Time Settings

## Overview

Add functionality to `DashboardView.tsx` to allow business owners to configure SMS reminder timing for appointments. The backend already supports this via the `reminder_time_minutes` field on the Salon model.

## Current State Analysis

### Backend API (from `docs/FRONTEND_API.md`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /salons/{id}/` | GET | Returns salon with `reminder_time_minutes` field |
| `PATCH /salons/{id}/` | PATCH | Updates salon, accepts `reminder_time_minutes` |

**API Response includes:**
```json
{
  "id": 1,
  "name": "Main Street Salon",
  "phone_number": "+447123456789",
  "reminder_time_minutes": 60,
  "addresses": [...],
  "created": "...",
  "modified": "..."
}
```

### Type Definitions Gap

**Current `src/types/salon.ts`** is missing `reminder_time_minutes`:

```typescript
// Current Salon interface - MISSING reminder_time_minutes
export interface Salon {
  id: number;
  name: string;
  addresses: Address[];
  phone_number: string;
  created: string;
  modified: string;
}
```

### Existing Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| `useGetSalon` hook | Ready | Fetches salon data |
| `useUpdateSalon` hook | Ready | Updates salon via PATCH |
| `UpdateSalonRequest` type | Needs update | Add `reminder_time_minutes` |
| `DashboardView.tsx` | Needs update | Add SMS settings section |

---

## Implementation Plan

### Phase 1: Type Updates

**File: `src/types/salon.ts`**

Add `reminder_time_minutes` to all relevant interfaces:

```typescript
// Updated Salon interface
export interface Salon {
  id: number;
  name: string;
  addresses: Address[];
  phone_number: string;
  reminder_time_minutes: number;  // ADD THIS
  created: string;
  modified: string;
}

// Updated UpdateSalonRequest interface
export interface UpdateSalonRequest {
  name?: string;
  addresses?: Array<{
    street: string;
    city: string;
    postal_code: string;
  }>;
  phone_number?: string;
  reminder_time_minutes?: number;  // ADD THIS
}

// Updated CreateSalonResponse interface
export interface CreateSalonResponse {
  id: number;
  name: string;
  addresses: Address[];
  phone_number: string;
  reminder_time_minutes: number;  // ADD THIS
  created: string;
  modified: string;
}

// Updated GetSalonResponse interface
export interface GetSalonResponse {
  id: number;
  name: string;
  addresses: Address[];
  phone_number: string;
  reminder_time_minutes: number;  // ADD THIS
  created: string;
  modified: string;
}
```

---

### Phase 2: DashboardView Component Updates

**File: `src/components/profile/DashboardView.tsx`**

#### 2.1 New Imports Required

```typescript
import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";  // Add Bell icon
import { useUpdateSalon } from "@/hooks/useSalon";
import Alert from "@/components/common/Alert";
```

#### 2.2 New State Variables

```typescript
// SMS Reminder settings state
const [reminderMinutes, setReminderMinutes] = useState<number>(60);
const [isEditingReminder, setIsEditingReminder] = useState(false);
const [alertState, setAlertState] = useState<{
  show: boolean;
  type: "success" | "error";
  message: string;
}>({ show: false, type: "success", message: "" });

// Initialize state when salon data loads
useEffect(() => {
  if (salon?.reminder_time_minutes) {
    setReminderMinutes(salon.reminder_time_minutes);
  }
}, [salon?.reminder_time_minutes]);
```

#### 2.3 Update Mutation Hook

```typescript
const updateSalonMutation = useUpdateSalon(salonId || 0);
```

#### 2.4 Handler Functions

```typescript
// Predefined reminder time options
const reminderOptions = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 1440, label: "1 day (24 hours)" },
];

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

const handleCancelEdit = () => {
  setReminderMinutes(salon?.reminder_time_minutes || 60);
  setIsEditingReminder(false);
};
```

#### 2.5 New UI Section (Add after Phone Section)

```tsx
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
              Send reminder SMS to customers before their appointment:
            </label>
            <select
              id="reminder-time"
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(Number(e.target.value))}
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
              {reminderOptions.find((opt) => opt.value === salon?.reminder_time_minutes)?.label ||
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

{/* Alert for feedback */}
{alertState.show && (
  <div className="fixed bottom-4 right-4 z-50 max-w-sm">
    <Alert
      show={alertState.show}
      type={alertState.type}
      message={alertState.message}
      onDismiss={() => setAlertState({ show: false, type: "success", message: "" })}
      autoHideDuration={5000}
    />
  </div>
)}
```

---

## Visual Design

### SMS Reminder Section Layout

```
┌─────────────────────────────────────────────────────────────┐
│ 🔔 SMS Reminder Settings                            [Edit]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ View Mode:                                                  │
│ ─────────                                                   │
│ Customers receive SMS reminders 1 hour before their        │
│ appointment.                                                │
│                                                             │
│ Edit Mode:                                                  │
│ ──────────                                                  │
│ Send reminder SMS to customers before their appointment:   │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 1 hour                                           ▼  │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ [Save]  [Cancel]                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Reminder Time Options

| Value (minutes) | Display Label | Use Case |
|-----------------|---------------|----------|
| 15 | 15 minutes | Last-minute reminder |
| 30 | 30 minutes | Short notice |
| 60 | 1 hour | Default, standard reminder |
| 120 | 2 hours | Advance notice |
| 1440 | 1 day (24 hours) | Day-before reminder |

---

## Access Control

| User Role | Can View | Can Edit |
|-----------|----------|----------|
| Owner (`is_owner: true`) | Yes | Yes |
| Staff (`is_staff: true`) | Yes | No |
| Customer | Yes | No |

---

## Implementation Checklist

- [ ] **Phase 1: Type Updates**
  - [ ] Add `reminder_time_minutes` to `Salon` interface
  - [ ] Add `reminder_time_minutes` to `UpdateSalonRequest` interface
  - [ ] Add `reminder_time_minutes` to `CreateSalonResponse` interface
  - [ ] Add `reminder_time_minutes` to `GetSalonResponse` interface

- [ ] **Phase 2: Component Updates**
  - [ ] Add `useState` and `useEffect` imports
  - [ ] Import `Bell` icon from lucide-react
  - [ ] Import `useUpdateSalon` hook
  - [ ] Import `Alert` component
  - [ ] Add state variables for reminder editing
  - [ ] Add `useEffect` to sync state with salon data
  - [ ] Add `useUpdateSalon` mutation
  - [ ] Add `reminderOptions` constant
  - [ ] Add `handleSaveReminder` function
  - [ ] Add `handleCancelEdit` function
  - [ ] Add SMS Reminder Settings section to JSX
  - [ ] Add Alert component for feedback

- [ ] **Testing**
  - [ ] Verify initial value displays correctly
  - [ ] Test edit mode toggle
  - [ ] Test dropdown selection
  - [ ] Test save functionality
  - [ ] Test cancel functionality
  - [ ] Test error handling
  - [ ] Test owner vs non-owner access
  - [ ] Verify API request payload

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/salon.ts` | Add `reminder_time_minutes` to interfaces |
| `src/components/profile/DashboardView.tsx` | Add SMS reminder settings section |

---

## Related Documentation

- Backend API: `docs/FRONTEND_API.md` (Salon section)
- Salon hooks: `src/hooks/useSalon.ts`
- Salon API: `src/api/salonApi.ts`
- Alert component: `src/components/common/Alert.tsx`
