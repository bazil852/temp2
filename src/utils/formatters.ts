import { formatDistanceToNow, isToday, format } from 'date-fns';

export const formatTime = (timestamp: string) => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};

export const formatTimeShort = (timestamp: string) => {
  const date = new Date(timestamp);
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  return format(date, 'MMM d, HH:mm');
};