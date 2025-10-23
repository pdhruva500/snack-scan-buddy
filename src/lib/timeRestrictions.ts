// Time-based access restrictions for snack sign-out

export const isLunchTime = (): boolean => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Lunch time: 11:30 AM to 1:15 PM
  const lunchStart = 11 * 60 + 45; // 11:45 in minutes
  const lunchEnd = 12 * 60 + 25;   // 12:25  in minutes
  const currentTime = hours * 60 + minutes;
  
  return currentTime >= lunchStart && currentTime <= lunchEnd;
};

export const getLunchTimeMessage = (): string => {
  return "Snack sign-out is temporarily disabled during lunch hours (11:45 AM - 12:25 PM).";
};
