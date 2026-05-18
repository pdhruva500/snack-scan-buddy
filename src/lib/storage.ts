// Storage utilities for snack logs (Supabase + localStorage fallback)
import { supabase } from '@/integrations/supabase/client';
import { buildCsv, downloadCsv as downloadCsvFile, formatExportDateTime, getLogsExportFilename } from './csvExport';

export interface SnackLog {
  id: string;
  studentName: string;
  snackName: string;
  timestamp: string;
  scanType?: 'manual' | 'barcode';
}

const STORAGE_KEY = 'smartsnack_logs';

// Fetch logs from Supabase (with localStorage fallback)
export const getSnackLogs = async (): Promise<SnackLog[]> => {
  try {
    // Try to fetch from Supabase first
    const { data, error } = await supabase
      .from('snack_logs')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    
    // Convert from database format to app format
    const logs: SnackLog[] = (data || []).map(row => ({
      id: row.id,
      studentName: row.student_name,
      snackName: row.snack_name,
      timestamp: row.timestamp ?? new Date().toISOString(),
      scanType: 'manual' as const,
    }));
    
    // Update localStorage cache
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    
    return logs;
  } catch (error) {
    console.error('Error fetching from Supabase, using localStorage:', error);
    // Fallback to localStorage
    try {
      const logs = localStorage.getItem(STORAGE_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (localError) {
      console.error('Error reading localStorage:', localError);
      return [];
    }
  }
};

// Legacy sync version for backward compatibility
export const getSnackLogsSync = (): SnackLog[] => {
  try {
    const logs = localStorage.getItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Error reading snack logs:', error);
    return [];
  }
};

export const addSnackLog = async (log: Omit<SnackLog, 'id' | 'timestamp'>): Promise<SnackLog> => {
  const newLog: SnackLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  
  // Save to localStorage immediately
  const localLogs = getSnackLogsSync();
  localLogs.unshift(newLog);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localLogs));
  
  // Note: Supabase insert requires user_id and snack_id which we don't have in simple mode
  // This storage.ts is for authenticated mode only - simple mode uses simpleLogService
  
  return newLog;
};

export const clearSnackLogs = async (): Promise<void> => {
  // Clear localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  
  // Try to clear Supabase
  try {
    const { error } = await supabase
      .from('snack_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (error) {
      console.error('Error clearing Supabase logs:', error);
    }
  } catch (error) {
    console.error('Failed to clear Supabase logs:', error);
  }
};

export const exportLogsToCSV = async (): Promise<string> => {
  const logs = await getSnackLogs();
  if (logs.length === 0) return '';
  
  const headers = ['Student Name', '', 'Snack', '', 'Date/Time', '', 'Scan Type'];
  const rows = logs.map(log => [
    log.studentName,
    '',
    log.snackName,
    '',
    formatExportDateTime(log.timestamp),
    '',
    log.scanType || 'manual'
  ]);
  
  return buildCsv(headers, rows);
};

export const downloadCSV = async (filename: string = getLogsExportFilename()): Promise<void> => {
  const csv = await exportLogsToCSV();
  if (!csv) return;
  
  downloadCsvFile(csv, filename);
};
