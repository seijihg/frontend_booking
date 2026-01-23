# Frontend Booking System

A Next.js 15 booking platform for appointment scheduling, built with React 19, TypeScript, and Tailwind CSS.

## Prerequisites

- Node.js >= 22.12.0 (see `.nvmrc`)
- Yarn package manager
- Backend API running (Django)

## Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:seijihg/frontend_booking.git
   cd frontend_booking
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/
   ```

## Running the Development Server

**Standard development mode:**
```bash
yarn dev
```

**Development with SSL (for testing HTTPS):**
```bash
yarn ssl
```

The application will be available at:
- `http://localhost:3000` (standard)
- `https://localhost:3000` (SSL mode)

## Other Commands

```bash
# Build for production
yarn build

# Start production server
yarn start

# Run linting
yarn lint
```

## Documentation

