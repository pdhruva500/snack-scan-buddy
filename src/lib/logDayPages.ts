/**
 * Utility functions for handling day-based pagination in snack logs
 * These functions help manage viewing logs separated by individual days
 */

/**
 * Converts a Date object to a date key string (YYYY-MM-DD format)
 * Uses local timezone to avoid UTC conversion issues
 */
export const toLocalDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Gets today's date key in YYYY-MM-DD format
 */
export const getTodayDateKey = (): string => {
  return toLocalDateKey(new Date());
};

/**
 * Formats a date key (YYYY-MM-DD) into a readable format
 * e.g., "YYYY-MM-DD" becomes "Monday, January 1, 2024"
 */
export const formatLogPageDate = (dateKey: string): string => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Adds or subtracts days from a date key
 * @param dateKey - Date key in YYYY-MM-DD format
 * @param days - Number of days to add (positive) or subtract (negative)
 * @returns New date key in YYYY-MM-DD format
 */
export const addDaysToDateKey = (dateKey: string, days: number): string => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toLocalDateKey(date);
};

/**
 * Checks if a log timestamp falls within a specific day
 * @param logTimestamp - ISO timestamp from database
 * @param dateKey - Date key in YYYY-MM-DD format
 * @returns true if the log occurred on that day
 */
export const isLogOnDate = (logTimestamp: string, dateKey: string): boolean => {
  const logDate = new Date(logTimestamp);
  const logDateKey = toLocalDateKey(logDate);
  return logDateKey === dateKey;
};

/**
 * Filters an array of logs to only include those from a specific day
 * @param logs - Array of log objects with timestamp property
 * @param dateKey - Date key in YYYY-MM-DD format
 * @returns Filtered array of logs
 */
export const filterLogsByDate = <T extends { timestamp: string }>(
  logs: T[],
  dateKey: string
): T[] => {
  return logs.filter((log) => isLogOnDate(log.timestamp, dateKey));
};

/**
 * Gets all unique dates from logs, sorted from newest to oldest
 * @param logs - Array of log objects with timestamp property
 * @returns Array of unique date keys in YYYY-MM-DD format
 */
export const getUniqueDatesFromLogs = <T extends { timestamp: string }>(
  logs: T[]
): string[] => {
  const uniqueDates = new Set<string>();
  logs.forEach((log) => {
    const dateKey = toLocalDateKey(new Date(log.timestamp));
    uniqueDates.add(dateKey);
  });
  
  return Array.from(uniqueDates).sort((a, b) => {
    // Sort newest to oldest
    return new Date(b).getTime() - new Date(a).getTime();
  });
};
