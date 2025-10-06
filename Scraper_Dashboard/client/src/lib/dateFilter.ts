import { parseISO, subDays, startOfYear, isAfter, isValid } from 'date-fns';

export function filterReelsByDate<T extends { datePosted: string }>(
  reels: T[],
  timeFilter: string
): T[] {
  if (timeFilter === 'all') return reels;

  const now = new Date();
  let startDate: Date;

  switch (timeFilter) {
    case '7d':
      startDate = subDays(now, 7);
      break;
    case '14d':
      startDate = subDays(now, 14);
      break;
    case '30d':
      startDate = subDays(now, 30);
      break;
    case '90d':
      startDate = subDays(now, 90);
      break;
    case '180d':
      startDate = subDays(now, 180);
      break;
    case 'ytd':
      startDate = startOfYear(now);
      break;
    default:
      return reels;
  }

  return reels.filter(reel => {
    if (!reel.datePosted) return false;
    const reelDate = parseISO(reel.datePosted);
    return isValid(reelDate) && isAfter(reelDate, startDate);
  });
}
