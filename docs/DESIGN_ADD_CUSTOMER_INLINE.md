# Design: Inline "Add New Customer" in CustomerSearchSelect

## Overview

Enhance the `CustomerSearchSelect` component to show an "Add new customer" option directly in the dropdown when no matching customers are found. This provides a seamless inline experience for creating new customers without leaving the search context.

---

## Current Behavior

### CustomerSearchSelect (`src/components/forms/CustomerSearchSelect.tsx`)
- User types in search box
- Dropdown shows filtered customers
- When no match: displays static "No customers found." text
- **No inline action to add a new customer**

### AppointmentForm (`src/components/calendar/AppointmentForm.tsx`)
- Has a separate "Add new customer" button below the search
- Opens a collapsible form for new customer creation
- Works but requires extra click and breaks search flow

---

## Proposed Behavior

### Enhanced Dropdown States

| State | Current Display | Proposed Display |
|-------|-----------------|------------------|
| Loading | "Loading customers..." | "Loading customers..." (unchanged) |
| Searching | "Searching..." | "Searching..." (unchanged) |
| No match found | "No customers found." | "No customers found." + **"+ Add '{query}' as new customer"** |
| No customers | "No customers available." | "No customers available." + **"+ Add new customer"** |
| Has matches | Customer list | Customer list (unchanged) |

### User Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Customer                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ John Smi...                                         ▼   │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ No customers found.                                     │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │  + Add "John Smith" as new customer                 │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Changes

### CustomerSearchSelect Props Update

```typescript
interface CustomerSearchSelectProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onCustomerChange: (customer: Customer | null) => void;
  isLoading?: boolean;
  label?: string;
  placeholder?: string;
  // NEW: Callback when user clicks "Add new customer"
  onAddNewCustomer?: (searchQuery: string) => void;
  // NEW: Show add option even when no query
  showAddOption?: boolean;
}
```

### Dropdown Modification

Replace the "No customers found" section with an interactive option:

```tsx
{filteredCustomers.length === 0 && debouncedQuery !== "" ? (
  <div className="py-2">
    <div className="px-4 py-2 text-sm text-gray-500">
      No customers found.
    </div>
    {onAddNewCustomer && (
      <button
        type="button"
        onClick={() => onAddNewCustomer(debouncedQuery)}
        className="w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
      >
        <PlusIcon className="h-4 w-4" />
        <span>
          Add "<span className="font-medium">{debouncedQuery}</span>" as new customer
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
        onClick={() => onAddNewCustomer("")}
        className="w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
      >
        <PlusIcon className="h-4 w-4" />
        <span>Add new customer</span>
      </button>
    )}
  </div>
) : (
  // ... existing customer list
)}
```

---

## AppointmentForm Integration

### Update Usage

```tsx
<CustomerSearchSelect
  customers={customers}
  selectedCustomer={selectedCustomer}
  onCustomerChange={setSelectedCustomer}
  isLoading={isLoadingCustomers}
  placeholder="Type to search for a customer..."
  onAddNewCustomer={(searchQuery) => {
    // Pre-fill the name with the search query
    setNewCustomerName(searchQuery);
    setShowNewCustomerForm(true);
  }}
  showAddOption={true}
/>
```

### Behavior
1. User types "John Smith" in search
2. No matching customer found
3. Dropdown shows: "No customers found." + "+ Add 'John Smith' as new customer"
4. User clicks the add button
5. New customer form opens with "John Smith" pre-filled in the name field
6. User completes phone number and submits

---

## Visual Design

### Add Customer Button Styling

```
┌─────────────────────────────────────────────────────────────┐
│  + Add "John Smith" as new customer                         │
└─────────────────────────────────────────────────────────────┘

States:
- Default: text-indigo-600, bg-transparent
- Hover: bg-indigo-50
- Focus: ring-2 ring-indigo-500

Icon: PlusIcon (Heroicons, h-4 w-4)
Text: "Add" + quoted query + "as new customer"
      OR "Add new customer" (when no query)
```

---

## Implementation Checklist

### Phase 1: Update CustomerSearchSelect Component
- [ ] Add `onAddNewCustomer` prop to interface
- [ ] Add `showAddOption` prop to interface
- [ ] Import `PlusIcon` from `@heroicons/react/20/solid`
- [ ] Update "No customers found" section with clickable button
- [ ] Update "No customers available" section with clickable button
- [ ] Style the add button with hover/focus states

### Phase 2: Update AppointmentForm
- [ ] Pass `onAddNewCustomer` callback to CustomerSearchSelect
- [ ] Pre-fill `newCustomerName` with the search query
- [ ] Auto-open the new customer form
- [ ] Pass `showAddOption={true}` prop

### Phase 3: Optional Enhancements
- [ ] Close dropdown after clicking add (if desired)
- [ ] Focus on first input in new customer form
- [ ] Add keyboard support (Enter to add)

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/forms/CustomerSearchSelect.tsx` | Add new props and inline add button |
| `src/components/calendar/AppointmentForm.tsx` | Pass callbacks and handle pre-fill |

---

## Dependencies

- `@heroicons/react/20/solid` - Already installed (needs `PlusIcon`)
- No new dependencies required

---

## Accessibility

- Button is focusable via keyboard
- Clear visual focus state with ring
- Descriptive text indicates action
- Works with screen readers

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Query is whitespace only | Treat as empty query, show generic "Add new customer" |
| Query is very long | Truncate with ellipsis in button text |
| `onAddNewCustomer` not provided | Don't show add button (backwards compatible) |
| User clicks add then cancels | Form closes, no customer created |
| Multiple rapid clicks | Debounce or disable button during action |

---

## Related Documentation

- Customer types: `src/types/customer.ts`
- Customer hooks: `src/hooks/useCustomers.ts`
- AppointmentForm: `src/components/calendar/AppointmentForm.tsx`
- CustomerSearchSelect: `src/components/forms/CustomerSearchSelect.tsx`
