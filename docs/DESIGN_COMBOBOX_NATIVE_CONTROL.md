# Design: Native Control for CustomerSearchSelect Dropdown

## Overview

Restructure the `CustomerSearchSelect` component to use Headless UI's native open/close control mechanisms instead of programmatically clicking the toggle button via ref.

---

## Current Implementation

### How Dropdown Closes Currently

```tsx
const buttonRef = useRef<HTMLButtonElement>(null);

const handleAddNewCustomer = (searchQuery: string) => {
  // Programmatically click the toggle button to close the dropdown
  buttonRef.current?.click();
  onAddNewCustomer?.(searchQuery);
};
```

### Problems with Current Approach

| Issue | Description |
|-------|-------------|
| Indirect | Simulates user click rather than using native API |
| Fragile | Depends on button ref and toggle behavior |
| Non-semantic | Click event doesn't express intent to "close" |

---

## Proposed Approaches

### Approach 1: Render Prop with `open` State (Recommended)

Use Headless UI's render prop pattern to access the `open` state and control visibility manually.

#### Key Changes

1. Use render prop `{({ open }) => ...}` from `<Combobox>`
2. Add `static` prop to `<Combobox.Options>` for manual control
3. Wrap content in conditional `{open && ...}` or use with `<Transition show={open}>`
4. Close by triggering a blur or calling internal close mechanism

#### Implementation

```tsx
import { Fragment, useState, useEffect, useMemo, useRef } from "react";
import { Combobox, Transition } from "@headlessui/react";

export default function CustomerSearchSelect({
  // ... props
}: CustomerSearchSelectProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown by blurring the input
  const closeDropdown = () => {
    inputRef.current?.blur();
  };

  const handleAddNewCustomer = (searchQuery: string) => {
    closeDropdown();
    onAddNewCustomer?.(searchQuery);
  };

  return (
    <Combobox value={selectedCustomer} onChange={onCustomerChange} nullable>
      {({ open }) => (
        <>
          <Combobox.Label>...</Combobox.Label>
          <div className="relative mt-2">
            <Combobox.Input
              ref={inputRef}
              // ... other props
            />
            <Combobox.Button>...</Combobox.Button>
          </div>

          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <Combobox.Options static>
              {/* ... options with add button */}
            </Combobox.Options>
          </Transition>
        </>
      )}
    </Combobox>
  );
}
```

#### Pros
- Uses official render prop pattern
- Explicit control over open state visibility
- Works naturally with Transition component

#### Cons
- Requires restructuring JSX (render prop children)
- Slightly more verbose
- Still needs blur workaround to close (no direct `setOpen(false)`)

---

### Approach 2: Headless UI v2.x with `onClose` Callback

Headless UI v2.x introduced the `onClose` callback prop for Combobox.

#### Check Version Compatibility

```bash
# Check installed version
yarn list @headlessui/react
```

#### Implementation (v2.x only)

```tsx
<Combobox
  value={selectedPerson}
  onChange={setSelectedPerson}
  onClose={() => setQuery('')}
>
  {/* ... */}
</Combobox>
```

**Note**: This callback is triggered when the dropdown closes, not to programmatically close it. The v2.x API still doesn't expose a `setOpen` function.

---

### Approach 3: Virtual Selection Pattern

Create a virtual "add new customer" option that behaves like a selection.

#### Implementation

```tsx
const ADD_NEW_CUSTOMER_OPTION = { id: "ADD_NEW", full_name: "", phone_number: "" };

const handleChange = (customer: Customer | typeof ADD_NEW_CUSTOMER_OPTION | null) => {
  if (customer?.id === "ADD_NEW") {
    // Don't actually select, just trigger the add flow
    onAddNewCustomer?.(query);
    return;
  }
  onCustomerChange(customer as Customer | null);
};

// In options list
<Combobox.Option value={ADD_NEW_CUSTOMER_OPTION}>
  <PlusIcon /> Add "{query}" as new customer
</Combobox.Option>
```

#### Pros
- Uses native Combobox.Option semantics
- Dropdown closes automatically on "selection"
- Keyboard navigation works out of the box

#### Cons
- Conflates "add" action with "select" action
- Requires special handling in onChange
- May confuse type system (mixing Customer with special object)

---

### Approach 4: Controlled Open State with External State

Take full control of the open state.

#### Implementation

```tsx
const [isOpen, setIsOpen] = useState(false);

const handleAddNewCustomer = (searchQuery: string) => {
  setIsOpen(false);
  onAddNewCustomer?.(searchQuery);
};

return (
  <Combobox value={selectedCustomer} onChange={onCustomerChange} nullable>
    {({ open }) => {
      // Sync internal open state with external (for other close triggers)
      useEffect(() => {
        setIsOpen(open);
      }, [open]);

      return (
        <>
          {/* ... */}
          {isOpen && (
            <Combobox.Options static>
              {/* ... */}
            </Combobox.Options>
          )}
        </>
      );
    }}
  </Combobox>
);
```

#### Pros
- Full control over visibility
- Clear imperative close capability

#### Cons
- Duplicates state (internal `open` + external `isOpen`)
- Must sync states carefully
- More complex than necessary

---

## Recommendation

### Primary: Approach 3 (Virtual Selection Pattern)

**Rationale**:
- Leverages Combobox's native option selection behavior
- Dropdown closes automatically (no workarounds needed)
- Keyboard navigation (Enter to select) works naturally
- Minimal code changes

### Secondary: Approach 1 (Render Prop with Blur)

Use if Approach 3 doesn't meet UX requirements (e.g., if "Add new customer" should not feel like a selection).

---

## Implementation Plan

### Phase 1: Virtual Selection Pattern

1. **Define sentinel value** for "add new customer" option
2. **Modify `onCustomerChange` handler** to intercept sentinel
3. **Replace button** with `<Combobox.Option>` for add action
4. **Remove buttonRef** workaround
5. **Test keyboard navigation** (arrow keys, Enter)

### Phase 2: Enhanced Styling

1. Style the add option differently from regular options
2. Add visual separator between options and add action
3. Ensure hover/focus states are distinct

### Phase 3: Accessibility Review

1. Verify screen reader announces add option appropriately
2. Test keyboard-only navigation flow
3. Ensure focus management after add action

---

## Code Diff Preview

### Before (Current)

```tsx
{filteredCustomers.length === 0 && debouncedQuery !== "" ? (
  <div className="py-2">
    <div className="px-4 py-2 text-sm text-gray-500">
      No customers found.
    </div>
    {onAddNewCustomer && (
      <button
        type="button"
        onClick={() => handleAddNewCustomer(debouncedQuery.trim())}
        className="..."
      >
        <PlusIcon className="h-4 w-4" />
        <span>Add "{debouncedQuery.trim()}" as new customer</span>
      </button>
    )}
  </div>
)}
```

### After (Virtual Selection)

```tsx
// Define sentinel outside component or use Symbol
const ADD_NEW_CUSTOMER = Symbol("ADD_NEW_CUSTOMER");

// In component
{filteredCustomers.length === 0 && debouncedQuery !== "" ? (
  <div className="py-2">
    <div className="relative cursor-default select-none px-4 py-2 text-sm text-gray-500">
      No customers found.
    </div>
    {onAddNewCustomer && (
      <Combobox.Option
        value={{ __isAddNew: true, query: debouncedQuery.trim() }}
        className={({ active }) =>
          classNames(
            "relative cursor-pointer select-none py-2 px-4 flex items-center gap-2",
            active ? "bg-indigo-50 text-indigo-600" : "text-indigo-600"
          )
        }
      >
        <PlusIcon className="h-4 w-4" />
        <span>Add "{debouncedQuery.trim()}" as new customer</span>
      </Combobox.Option>
    )}
  </div>
)}

// Update onChange handler prop docs
interface CustomerSearchSelectProps {
  // ...
  /**
   * Called when customer selection changes.
   * Receives null for clear, Customer for selection.
   * NOTE: "Add new customer" action triggers onAddNewCustomer instead.
   */
  onCustomerChange: (customer: Customer | null) => void;
}
```

---

## Type Safety Considerations

### Option 1: Discriminated Union

```typescript
type SelectionValue =
  | Customer
  | { __isAddNew: true; query: string };

function isAddNewAction(value: SelectionValue | null): value is { __isAddNew: true; query: string } {
  return value !== null && '__isAddNew' in value;
}
```

### Option 2: Wrapper Function

Handle the discrimination inside the component and expose clean callbacks:

```tsx
const handleSelection = (value: Customer | AddNewMarker | null) => {
  if (isAddNewAction(value)) {
    onAddNewCustomer?.(value.query);
    return;
  }
  onCustomerChange(value);
};

<Combobox value={selectedCustomer} onChange={handleSelection} nullable>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/forms/CustomerSearchSelect.tsx` | Replace button with Combobox.Option, add internal handler |
| `src/types/customer.ts` | (Optional) Add AddNewCustomerMarker type |

---

## Migration Notes

- **Breaking Change**: None (external API unchanged)
- **Behavior Change**: Add action now uses option selection instead of button click
- **Keyboard UX**: Improved (Enter key now works to add customer)

---

## Testing Checklist

- [ ] Click "Add new customer" option closes dropdown
- [ ] Pressing Enter on focused "Add new customer" option closes dropdown
- [ ] Arrow keys navigate between customers and add option
- [ ] onAddNewCustomer callback receives correct query
- [ ] Regular customer selection still works
- [ ] Empty state ("No customers available") add option works
- [ ] Screen reader announces add option appropriately

---

## References

- [Headless UI Combobox Documentation](https://headlessui.com/react/combobox)
- [Headless UI Render Props Pattern](https://headlessui.com/react/combobox#using-render-props)
- [Combobox Static Prop](https://headlessui.com/react/combobox#rendering-a-different-element-for-the-options)
