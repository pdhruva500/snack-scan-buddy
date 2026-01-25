import { supabase } from '@/integrations/supabase/client';

export interface SimpleLog {
  id: string;
  firstName: string;
  lastName: string;
  foodItem: string;
  timestamp: string;
  barcode?: string | null;
  crossedOut?: boolean;
}

const STORAGE_KEY = 'simple_logs';

// Save a new log to Supabase (with localStorage fallback)
export const saveLog = async (log: Omit<SimpleLog, 'id' | 'timestamp' | 'crossedOut'>): Promise<SimpleLog> => {
  const newLog: SimpleLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    crossedOut: false,
  };

  // Save to localStorage immediately as cache
  const localLogs = getLocalLogs();
  localLogs.unshift(newLog);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localLogs));

  // Sync to Supabase
  try {
    const { error } = await supabase
      .from('simple_logs')
      .insert({
        id: newLog.id,
        first_name: newLog.firstName,
        last_name: newLog.lastName,
        food_item: newLog.foodItem,
        timestamp: newLog.timestamp,
        barcode: newLog.barcode || null,
        crossed_out: false,
      });

    if (error) {
      console.error('Error saving to backend:', error);
    } else {
      console.log('✅ Synced to backend:', newLog.foodItem);
    }
  } catch (error) {
    console.error('Failed to sync with backend:', error);
  }

  return newLog;
};

// Load all logs from Supabase
export const loadLogs = async (): Promise<SimpleLog[]> => {
  try {
    const { data, error } = await supabase
      .from('simple_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;

    const logs: SimpleLog[] = (data || []).map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      foodItem: row.food_item,
      timestamp: row.timestamp ?? new Date().toISOString(),
      barcode: row.barcode,
      crossedOut: row.crossed_out,
    }));

    // Update localStorage cache
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));

    return logs;
  } catch (error) {
    console.error('Error loading from backend, using localStorage:', error);
    return getLocalLogs();
  }
};

// Get logs from localStorage (for offline/fallback)
export const getLocalLogs = (): SimpleLog[] => {
  try {
    const logs = localStorage.getItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch {
    return [];
  }
};

// Toggle crossed out status
export const toggleCrossedOut = async (logId: string): Promise<void> => {
  // Update localStorage first
  const localLogs = getLocalLogs();
  const logIndex = localLogs.findIndex(l => l.id === logId);
  if (logIndex !== -1) {
    localLogs[logIndex].crossedOut = !localLogs[logIndex].crossedOut;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localLogs));
  }

  // Sync to Supabase
  try {
    const newCrossedOut = localLogs[logIndex]?.crossedOut ?? false;
    const { error } = await supabase
      .from('simple_logs')
      .update({ crossed_out: newCrossedOut })
      .eq('id', logId);

    if (error) {
      console.error('Error updating crossed out status:', error);
    }
  } catch (error) {
    console.error('Failed to sync crossed out status:', error);
  }
};

// Delete a single log
export const deleteLog = async (logId: string): Promise<void> => {
  // Remove from localStorage
  const localLogs = getLocalLogs().filter(l => l.id !== logId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localLogs));

  // Delete from Supabase
  try {
    const { error } = await supabase
      .from('simple_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      console.error('Error deleting log:', error);
    }
  } catch (error) {
    console.error('Failed to delete log from backend:', error);
  }
};

// Clear all logs
export const clearAllLogs = async (): Promise<void> => {
  // Clear localStorage
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('simple_total_scans');

  // Clear Supabase
  try {
    const { error } = await supabase
      .from('simple_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error clearing logs from backend:', error);
    }
  } catch (error) {
    console.error('Failed to clear backend logs:', error);
  }
};
