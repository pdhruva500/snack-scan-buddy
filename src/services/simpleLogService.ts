// Simple localStorage-only log service
// No Supabase integration

interface SimpleLog {
  id: string;
  firstName: string;
  lastName: string;
  foodItem: string;
  timestamp: string;
  barcode?: string | null;
}

// This file is intentionally empty of Supabase code
// All log operations use localStorage directly in the components
