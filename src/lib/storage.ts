// Local storage utilities for snack logs

export interface SnackLog {
  id: string;
  studentName: string;
  snackName: string;
  timestamp: string;
  scanType?: 'manual' | 'barcode';
}

const STORAGE_KEY = 'smartsnack_logs';

export const getSnackLogs = (): SnackLog[] => {
  try {
    const logs = localStorage.getItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Error reading snack logs:', error);
    return [];
  }
};

export const addSnackLog = (log: Omit<SnackLog, 'id' | 'timestamp'>): SnackLog => {
  const newLog: SnackLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  
  const logs = getSnackLogs();
  logs.unshift(newLog); // Add to beginning for most recent first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  
  return newLog;
};

export const clearSnackLogs = (): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
};

export const exportLogsToCSV = (): string => {
  const logs = getSnackLogs();
  if (logs.length === 0) return '';
  
  const headers = ['Student Name', 'Snack', 'Time', 'Scan Type'];
  const rows = logs.map(log => [
    log.studentName,
    log.snackName,
    new Date(log.timestamp).toLocaleString(),
    log.scanType || 'manual'
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
};

export const downloadCSV = (filename: string = 'smartsnack-logs.csv'): void => {
  const csv = exportLogsToCSV();
  if (!csv) return;
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
