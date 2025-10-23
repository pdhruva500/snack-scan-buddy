// Time-based access restrictions for snack sign-out

export const isLunchTime = (): boolean => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Lunch time: 11:30 AM to 1:15 PM
  const lunchStart = 11 * 60 + 30; // 11:30 in minutes
  const lunchEnd = 13 * 60 + 15;   // 13:15 (1:15 PM) in minutes
  const currentTime = hours * 60 + minutes;
  
  return currentTime >= lunchStart && currentTime <= lunchEnd;
};

export const getLunchTimeMessage = (): string => {
  return "Snack sign-out is temporarily disabled during lunch hours (11:30 AM - 1:15 PM).";
};
