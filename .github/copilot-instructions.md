# Snack Scan Buddy - AI Coding Guide

This document provides essential context for AI agents working with this codebase.

## Project Architecture

- **Frontend**: React + Vite + TypeScript + ShadcnUI
- **Backend**: Supabase for authentication, database, and edge functions
- **Key Features**: Barcode scanning, snack tracking, admin dashboard

### Core Components

1. **Authentication Flow**:
   - Managed via Supabase (`src/hooks/useAuth.tsx`)
   - Auth pages: `src/pages/Auth.tsx`, `src/pages/SignOut.tsx`

2. **Barcode Scanner**:
   - Uses ZXing library (`@zxing/browser`)
   - Implementation in `src/components/BarcodeScanner.tsx`
   - Handles camera access and barcode detection

3. **UI Components**:
   - Based on Shadcn/ui (accessible in `src/components/ui/`)
   - Custom components in `src/components/`

## Development Workflow

```bash
# Install dependencies
npm i

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Key Integration Points

1. **Supabase Setup**:
   - Client initialization in `src/integrations/supabase/client.ts`
   - Required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Edge functions in `supabase/functions/`

2. **Route Management**:
   - All routes defined in `src/App.tsx`
   - New routes must be added above the catch-all "*" route

## Project Conventions

1. **Component Structure**:
   - Use TypeScript interfaces for props
   - Place shared UI components in `src/components/ui/`
   - Custom hooks go in `src/hooks/`

2. **State Management**:
   - React Query for server state (`QueryClientProvider` in `App.tsx`)
   - Local storage for persistent client state (`src/lib/storage.ts`)

3. **File Organization**:
   - Page components in `src/pages/`
   - Shared utilities in `src/lib/`
   - Supabase types in `src/integrations/supabase/types.ts`