# Design: Inline Section Editing for DashboardView

## Overview

Refactor `DashboardView.tsx` to replace the generic "Edit Information" button with inline edit buttons for each editable section. This follows the pattern established in the SMS Reminder Settings section.

## Current State Analysis

### Sections in DashboardView (Lines 192-404)

| Section | Line | Icon | Editable | API Endpoint |
|---------|------|------|----------|--------------|
| Business Address | 192-216 | MapPin | Yes (owner) | `PATCH /salons/{id}/` |
| Contact Information | 218-231 | Phone | Yes (owner) | `PATCH /salons/{id}/` |
| SMS Reminder Settings | 233-327 | Bell | Yes (owner) | `PATCH /salons/{id}/` - **Already implemented** |
| Your Profile | 329-355 | User | Yes (self) | `PATCH /users/{id}/` |
| Additional Information | 357-392 | Calendar | No | Read-only metadata |
| Action Buttons | 394-404 | - | **Remove** | N/A |

### API Capabilities (from `docs/FRONTEND_API.md`)

**Salon Update (`PATCH /salons/{id}/`):**
```json
{
  "name": "string",
  "phone_number": "string",
  "reminder_time_minutes": "number",
  "addresses": [{ "street": "string", "city": "string", "postal_code": "string" }]
}
```

**User Update (`PATCH /users/{id}/`):**
```json
{
  "full_name": "string",
  "phone_number": "string"
}
```

---

## Implementation Plan

### Phase 1: Remove Generic Action Buttons

**File: `src/components/profile/DashboardView.tsx`**

Remove lines 394-404:
```tsx
{/* Action Buttons */}
<div className="border-t border-gray-200 pt-6">
  <div className="flex gap-3">
    <button className="px-4 py-2 bg-indigo-600 ...">Edit Information</button>
    <button className="px-4 py-2 bg-white ...">View Reports</button>
  </div>
</div>
```

---

### Phase 2: Add State for Each Editable Section

```typescript
// Editing state for each section
const [isEditingAddress, setIsEditingAddress] = useState(false);
const [isEditingPhone, setIsEditingPhone] = useState(false);
const [isEditingProfile, setIsEditingProfile] = useState(false);

// Form state for Address section
const [editAddress, setEditAddress] = useState({
  street: "",
  city: "",
  postal_code: "",
});

// Form state for Phone section
const [editPhone, setEditPhone] = useState("");

// Form state for Profile section
const [editProfile, setEditProfile] = useState({
  full_name: "",
  phone_number: "",
});
```

---

### Phase 3: Add useEffect to Sync Form State

```typescript
// Sync address form when salon data loads
useEffect(() => {
  if (salon?.addresses?.[0]) {
    setEditAddress({
      street: salon.addresses[0].street || "",
      city: salon.addresses[0].city || "",
      postal_code: salon.addresses[0].postal_code || "",
    });
  }
}, [salon?.addresses]);

// Sync phone form when salon data loads
useEffect(() => {
  if (salon?.phone_number) {
    setEditPhone(salon.phone_number);
  }
}, [salon?.phone_number]);

// Sync profile form when user data loads
useEffect(() => {
  if (user) {
    setEditProfile({
      full_name: user.full_name || `${user.first_name} ${user.last_name}`.trim(),
      phone_number: user.phone_number || "",
    });
  }
}, [user]);
```

---

### Phase 4: Add Handler Functions

```typescript
// Save Address
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

// Cancel Address Edit
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

// Save Phone
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

// Cancel Phone Edit
const handleCancelPhone = () => {
  setEditPhone(salon?.phone_number || "");
  setIsEditingPhone(false);
};

// Save Profile (requires user API hook)
const handleSaveProfile = async () => {
  try {
    // TODO: Implement useUpdateUser hook
    await updateUserMutation.mutateAsync({
      full_name: editProfile.full_name,
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

// Cancel Profile Edit
const handleCancelProfile = () => {
  if (user) {
    setEditProfile({
      full_name: user.full_name || `${user.first_name} ${user.last_name}`.trim(),
      phone_number: user.phone_number || "",
    });
  }
  setIsEditingProfile(false);
};
```

---

### Phase 5: Update UI Sections

#### 5.1 Business Address Section

```tsx
{/* Address Section */}
{salon.addresses && salon.addresses.length > 0 && (
  <div className="border-t border-gray-200 pt-6">
    <div className="flex items-start gap-3">
      <MapPin className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">
            Business Address{salon.addresses.length > 1 ? "es" : ""}
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
              <label htmlFor="street" className="block text-sm text-gray-600 mb-1">
                Street
              </label>
              <input
                type="text"
                id="street"
                value={editAddress.street}
                onChange={(e) => setEditAddress({ ...editAddress, street: e.target.value })}
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm text-gray-600 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  value={editAddress.city}
                  onChange={(e) => setEditAddress({ ...editAddress, city: e.target.value })}
                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="postal_code" className="block text-sm text-gray-600 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postal_code"
                  value={editAddress.postal_code}
                  onChange={(e) => setEditAddress({ ...editAddress, postal_code: e.target.value })}
                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveAddress}
                disabled={updateSalonMutation.isPending}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
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
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {salon.addresses.map((address) => (
              <address key={address.id} className="text-sm text-gray-600 not-italic mb-3">
                <p>{address.street}</p>
                <p>{address.city}, {address.postal_code}</p>
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
```

#### 5.2 Contact Information Section

```tsx
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
            <label htmlFor="phone" className="block text-sm text-gray-600 mb-1">
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
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
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
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
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
```

#### 5.3 Your Profile Section

```tsx
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
            <div>
              <label htmlFor="full_name" className="block text-sm text-gray-600 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                value={editProfile.full_name}
                onChange={(e) => setEditProfile({ ...editProfile, full_name: e.target.value })}
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="user_phone" className="block text-sm text-gray-600 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="user_phone"
                value={editProfile.phone_number}
                onChange={(e) => setEditProfile({ ...editProfile, phone_number: e.target.value })}
                placeholder="+447123456789"
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Email
              </label>
              <p className="text-sm text-gray-500 italic">
                {user.email} (cannot be changed)
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={updateUserMutation?.isPending}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {updateUserMutation?.isPending ? (
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
                disabled={updateUserMutation?.isPending}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
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
```

---

## Prerequisites: User API Hook

**File: `src/api/userApi.ts`** - Add update function:

```typescript
export const updateUser = async (userId: number, data: { full_name?: string; phone_number?: string }) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}users/${userId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update user: ${text}`);
  }

  return res.json();
};
```

**File: `src/hooks/useUser.ts`** - Create new hook:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "@/api/userApi";

export const useUpdateUser = (userId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { full_name?: string; phone_number?: string }) =>
      updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};
```

---

## Implementation Checklist

- [ ] **Phase 1: Remove Action Buttons**
  - [ ] Remove lines 394-404 (Action Buttons section)

- [ ] **Phase 2: Add State Variables**
  - [ ] Add `isEditingAddress`, `isEditingPhone`, `isEditingProfile` state
  - [ ] Add `editAddress`, `editPhone`, `editProfile` form state

- [ ] **Phase 3: Add useEffect Hooks**
  - [ ] Sync address form state
  - [ ] Sync phone form state
  - [ ] Sync profile form state

- [ ] **Phase 4: Add Handler Functions**
  - [ ] `handleSaveAddress` / `handleCancelAddress`
  - [ ] `handleSavePhone` / `handleCancelPhone`
  - [ ] `handleSaveProfile` / `handleCancelProfile`

- [ ] **Phase 5: Update UI Sections**
  - [ ] Update Address section with inline editing
  - [ ] Update Phone section with inline editing
  - [ ] Update Profile section with inline editing
  - [ ] Keep SMS Reminder section as-is (already implemented)
  - [ ] Keep Additional Information section as read-only

- [ ] **Prerequisites**
  - [ ] Add `updateUser` to `src/api/userApi.ts`
  - [ ] Create `useUpdateUser` hook in `src/hooks/useUser.ts`

- [ ] **Testing**
  - [ ] Test address edit (owner only)
  - [ ] Test phone edit (owner only)
  - [ ] Test profile edit (any user)
  - [ ] Test cancel functionality
  - [ ] Test error handling
  - [ ] Test loading states

---

## Access Control Summary

| Section | Who Can Edit |
|---------|--------------|
| Business Address | Owner only (`user?.is_owner`) |
| Contact Information | Owner only (`user?.is_owner`) |
| SMS Reminder Settings | Owner only (`user?.is_owner`) |
| Your Profile | Any authenticated user (self) |
| Additional Information | No one (read-only metadata) |

---

## Files to Modify/Create

| File | Action |
|------|--------|
| `src/components/profile/DashboardView.tsx` | Modify - Add inline editing |
| `src/api/userApi.ts` | Modify - Add `updateUser` function |
| `src/hooks/useUser.ts` | Create - Add `useUpdateUser` hook |

---

## Related Documentation

- Backend API: `docs/FRONTEND_API.md`
- SMS Reminder Design: `docs/DESIGN_SMS_REMINDER_SETTINGS.md`
- Salon hooks: `src/hooks/useSalon.ts`
