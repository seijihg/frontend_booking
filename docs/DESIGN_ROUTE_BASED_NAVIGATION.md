# Design: Route-Based Navigation Architecture

## Overview

Migrate from client-side view switching (useState) to Next.js App Router file-based routing for Dashboard, Calendar, and Customers views.

## Current Architecture

```
src/app/
├── dashboard/
│   └── page.tsx          # Single page with MainComponent
├── login/
│   └── page.tsx
├── layout.tsx
└── page.tsx

src/components/dashboard/
├── MainComponent.tsx     # Client-side view switching via useState
└── navigation_bar/
    └── NavBar.tsx        # onClick handlers change local state
```

**Current Flow**:
1. User visits `/dashboard`
2. `MainComponent` renders with `useState<ViewType>("dashboard")`
3. NavBar buttons call `onViewChange(view)` to update state
4. `renderContent()` switch statement renders appropriate component

**Problems**:
- No shareable/bookmarkable URLs for specific views
- Browser back/forward doesn't work between views
- No route-level code splitting
- SEO limitations (all views on single route)

---

## Proposed Architecture

```
src/app/
├── (protected)/                    # Route group for auth protection
│   ├── layout.tsx                  # Shared layout with auth + NavBar
│   ├── dashboard/
│   │   └── page.tsx               # Dashboard/Settings view
│   ├── calendar/
│   │   └── page.tsx               # Calendar view
│   └── customers/
│       └── page.tsx               # Customers view
├── login/
│   └── page.tsx
├── layout.tsx                      # Root layout
└── page.tsx                        # Home redirect → /dashboard
```

**New URLs**:
| View | Current URL | New URL |
|------|-------------|---------|
| Dashboard/Settings | `/dashboard` (state) | `/dashboard` |
| Calendar | `/dashboard` (state) | `/calendar` |
| Customers | `/dashboard` (state) | `/customers` |

---

## Implementation Plan

### Phase 1: Create Route Group and Shared Layout

**File: `src/app/(protected)/layout.tsx`**

```tsx
import { redirect } from "next/navigation";
import getUser from "@/api/userApi";
import DashboardNavBar from "@/components/dashboard/navigation_bar/DashboardNavBar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check
  const data = await getUser();
  const user = data?.user;

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen flex-col">
      <DashboardNavBar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
```

### Phase 2: Create Individual Route Pages

**File: `src/app/(protected)/dashboard/page.tsx`**

```tsx
import DashboardView from "@/components/profile/DashboardView";

export const metadata = {
  title: "Dashboard | Booking System",
};

export default function DashboardPage() {
  return <DashboardView />;
}
```

**File: `src/app/(protected)/calendar/page.tsx`**

```tsx
import CalendarView from "@/components/calendar/CalendarView";

export const metadata = {
  title: "Calendar | Booking System",
};

export default function CalendarPage() {
  return <CalendarView />;
}
```

**File: `src/app/(protected)/customers/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import getUser from "@/api/userApi";
import CustomersView from "@/components/customers/CustomersView";

export const metadata = {
  title: "Customers | Booking System",
};

export default async function CustomersPage() {
  // Role-based access control
  const data = await getUser();
  const user = data?.user;

  if (!user?.is_owner && !user?.is_staff) {
    redirect("/dashboard");
  }

  return <CustomersView />;
}
```

### Phase 3: Refactor NavBar to Use Links

**File: `src/components/dashboard/navigation_bar/DashboardNavBar.tsx`**

```tsx
"use client";

import { Fragment } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

import { useUserStore } from "@/stores/userStore";

const navigation = [
  { name: "Dashboard", href: "/dashboard", requiresStaffOrOwner: false },
  { name: "Calendar", href: "/calendar", requiresStaffOrOwner: false },
  { name: "Customers", href: "/customers", requiresStaffOrOwner: true },
];

const userNavigation = [
  { name: "Your Profile", href: "/dashboard" },
  { name: "Settings", href: "/dashboard" },
];

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}

export default function DashboardNavBar() {
  const { user, clearUser } = useUserStore();
  const pathname = usePathname();
  const router = useRouter();

  // Filter navigation items based on user role
  const visibleNavigation = navigation.filter(
    (item) => !item.requiresStaffOrOwner || user?.is_owner || user?.is_staff
  );

  const isCurrentPath = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        clearUser();
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Disclosure as="nav" className="bg-gray-800">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                {/* Mobile menu button */}
                <div className="-ml-2 mr-2 flex items-center md:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>

                {/* Desktop navigation */}
                <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
                  {visibleNavigation.map((item) => {
                    const isCurrent = isCurrentPath(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={classNames(
                          isCurrent
                            ? "bg-gray-900 text-white"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white",
                          "rounded-md px-3 py-2 text-sm font-medium"
                        )}
                        aria-current={isCurrent ? "page" : undefined}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Right side - notifications and profile */}
              <div className="flex items-center">
                <div className="hidden md:ml-4 md:flex md:flex-shrink-0 md:items-center">
                  <button
                    type="button"
                    className="rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </button>

                  {/* Profile dropdown */}
                  <Menu as="div" className="relative ml-3">
                    {/* ... profile menu implementation (same as current) ... */}
                  </Menu>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu panel */}
          <Disclosure.Panel className="md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
              {visibleNavigation.map((item) => {
                const isCurrent = isCurrentPath(item.href);
                return (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    href={item.href}
                    className={classNames(
                      isCurrent
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white",
                      "block rounded-md px-3 py-2 text-base font-medium"
                    )}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {item.name}
                  </Disclosure.Button>
                );
              })}
            </div>
            {/* ... mobile profile section (same as current) ... */}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
```

### Phase 4: Update Root Page Redirect

**File: `src/app/page.tsx`**

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  // Redirect root to dashboard (or calendar for appointment-first UX)
  redirect("/dashboard");
}
```

---

## File Changes Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `src/app/(protected)/layout.tsx` | Shared layout with auth check + NavBar |
| `src/app/(protected)/dashboard/page.tsx` | Dashboard/Settings page |
| `src/app/(protected)/calendar/page.tsx` | Calendar page |
| `src/app/(protected)/customers/page.tsx` | Customers page (with role check) |
| `src/components/dashboard/navigation_bar/DashboardNavBar.tsx` | New NavBar with Link routing |

### Files to Modify

| File | Change |
|------|--------|
| `src/app/page.tsx` | Update redirect to `/dashboard` |

### Files to Delete (after migration)

| File | Reason |
|------|--------|
| `src/app/dashboard/page.tsx` | Replaced by `(protected)/dashboard/page.tsx` |
| `src/components/dashboard/MainComponent.tsx` | Replaced by route group layout |
| `src/components/dashboard/navigation_bar/NavBar.tsx` | Replaced by DashboardNavBar |

---

## Final Folder Structure

```
src/app/
├── (protected)/                    # Route group (no URL segment)
│   ├── layout.tsx                  # Auth check + NavBar wrapper
│   ├── dashboard/
│   │   └── page.tsx               # /dashboard
│   ├── calendar/
│   │   └── page.tsx               # /calendar
│   └── customers/
│       └── page.tsx               # /customers (role-protected)
├── login/
│   └── page.tsx                   # /login
├── layout.tsx                      # Root layout
└── page.tsx                        # / → redirects to /dashboard
```

---

## Route Group Explanation

The `(protected)` folder uses Next.js route group syntax:
- **Parentheses** `()` mean the folder name is NOT part of the URL
- Routes become `/dashboard`, `/calendar`, `/customers` (NOT `/protected/dashboard`)
- Allows shared `layout.tsx` for authentication without affecting URLs
- All pages inside share the same NavBar and auth protection

---

## Authentication Flow

```
User visits /calendar
        ↓
(protected)/layout.tsx (server component)
        ↓
    getUser() → JWT cookie validation
        ↓
    ┌─ No user → redirect("/login")
    │
    └─ User exists → render children
                        ↓
              calendar/page.tsx
                        ↓
                 CalendarView
```

---

## Role-Based Access Control

The Customers page has additional role protection:

```
User visits /customers
        ↓
(protected)/layout.tsx → Auth check ✓
        ↓
customers/page.tsx (server component)
        ↓
    getUser() → Role validation
        ↓
    ┌─ Not owner/staff → redirect("/dashboard")
    │
    └─ Authorized → render CustomersView
```

---

## Migration Checklist

### Setup
- [x] Create `src/app/(protected)/` folder
- [x] Create `src/app/(protected)/layout.tsx` with auth check
- [x] Create `src/app/(protected)/dashboard/page.tsx`
- [x] Create `src/app/(protected)/calendar/page.tsx`
- [x] Create `src/app/(protected)/customers/page.tsx` with role check

### NavBar
- [x] Create `DashboardNavBar.tsx` with Link components
- [x] Update navigation hrefs to `/dashboard`, `/calendar`, `/customers`
- [x] Update `isCurrentPath()` logic for route matching

### Cleanup
- [x] Update `src/app/page.tsx` redirect to `/dashboard`
- [x] Delete old `src/app/dashboard/page.tsx`
- [x] Delete `MainComponent.tsx`
- [x] Delete old `NavBar.tsx`

### Testing
- [ ] Test `/dashboard` loads DashboardView
- [ ] Test `/calendar` loads CalendarView
- [ ] Test `/customers` loads CustomersView (with permission)
- [ ] Test `/customers` redirects for non-staff users
- [ ] Test unauthenticated access redirects to `/login`
- [ ] Test browser back/forward navigation
- [ ] Test NavBar active states
- [ ] Test mobile navigation menu

### Documentation
- [x] Update CLAUDE.md folder structure
- [x] Update CLAUDE.md with new routes

---

## URL Comparison

| Action | Before | After |
|--------|--------|-------|
| View dashboard | `/dashboard` + click "Dashboard" | `/dashboard` |
| View calendar | `/dashboard` + click "Calendar" | `/calendar` |
| View customers | `/dashboard` + click "Customers" | `/customers` |
| Share calendar link | Not possible | Send `/calendar` URL |
| Browser back | Doesn't work | Works correctly |
| Bookmark page | Only bookmarks `/dashboard` | Bookmarks actual view |

---

## Benefits

1. **Shareable URLs**: Each view has its own URL
2. **Browser navigation**: Back/forward buttons work
3. **Bookmarkable**: Users can bookmark specific views
4. **Code splitting**: Each page loads only what it needs
5. **SEO**: Search engines can index each page
6. **Cleaner code**: No useState view switching logic
7. **Server components**: Auth check runs on server
8. **Type safety**: Routes are explicit, not magic strings

---

## Testing Plan

1. **Route accessibility**
   - Visit `/dashboard` → Dashboard loads
   - Visit `/calendar` → Calendar loads
   - Visit `/customers` → Customers loads (with permission)
   - Visit `/` → Redirects to `/dashboard`

2. **Authentication**
   - Unauthenticated user on `/calendar` → redirects to `/login`
   - After login → can navigate to all routes

3. **Navigation**
   - NavBar links update URL correctly
   - Active state highlights current route
   - Browser back/forward works between views

4. **Role-based access**
   - Non-staff user → Customers link hidden in NavBar
   - Non-staff direct `/customers` access → redirects to `/dashboard`

5. **Deep linking**
   - Share `/calendar` URL → loads correctly for authenticated users
   - Bookmark `/customers` → works for authorized users
