import { supabase } from '@/integrations/supabase/client';

interface SimpleLog {
  id: string;
  firstName: string;
  lastName: string;
  foodItem: string;
  timestamp: string;
  barcode?: string | null;
}

// Sync simple_logs from localStorage to Supabase
export const syncLogToSupabase = async (log: SimpleLog): Promise<void> => {
  try {
    // Use raw SQL to insert into our simple table
    const { error } = await supabase.rpc('insert_simple_log', {
      log_id: log.id,
      student: `${log.firstName} ${log.lastName}`,
      snack: log.foodItem,
      log_time: log.timestamp,
      scan_type_val: log.barcode ? 'barcode' : 'manual',
    });

    if (error) {
      console.error('Error syncing to Supabase:', error);
    } else {
      console.log('✅ Synced to Supabase:', log.foodItem);
    }
  } catch (error) {
    console.error('Failed to sync with Supabase:', error);
  }
};

// Load logs from Supabase - Supabase is the single source of truth
export const loadLogsFromSupabase = async (): Promise<SimpleLog[]> => {
  try {
    const { data, error } = await supabase.rpc('get_simple_logs');

    if (error) throw error;

    // Convert Supabase format to SimpleLog format
    const supabaseLogs: SimpleLog[] = (data || []).map((row: any) => {
      const [firstName = '', lastName = ''] = (row.student_name || '').split(' ', 2);
      // Ensure timestamp is a valid ISO string
      let timestamp = row.timestamp;
      if (timestamp && typeof timestamp === 'string') {
        try {
          timestamp = new Date(timestamp).toISOString();
        } catch {
          timestamp = new Date().toISOString();
        }
      } else {
        timestamp = new Date().toISOString();
      }
      return {
        id: row.id,
        firstName,
        lastName: lastName || firstName,
        foodItem: row.snack_name,
        timestamp,
        barcode: row.scan_type === 'barcode' ? 'scanned' : null,
      };
    });

    // Update localStorage to match Supabase (cache only)
    localStorage.setItem('simple_logs', JSON.stringify(supabaseLogs));
    
    return supabaseLogs;
  } catch (error) {
    console.error('Error loading from Supabase, using localStorage fallback:', error);
    return JSON.parse(localStorage.getItem('simple_logs') || '[]');
  }
};

// Clear all logs from both localStorage and Supabase
export const clearAllLogs = async (): Promise<void> => {
  // Clear localStorage
  localStorage.removeItem('simple_logs');
  localStorage.removeItem('simple_total_scans');
  
  // Try to clear Supabase
  try {
    const { error } = await supabase.rpc('clear_simple_logs');

    if (error) {
      console.error('Error clearing Supabase logs:', error);
    }
  } catch (error) {
    console.error('Failed to clear Supabase logs:', error);
  }
};
