import { LocationData, TimeSlot, WeatherType } from '../types';

// Map common timezones to iconic coarse cities
const TIMEZONE_TO_CITY: Record<string, { city: string; country: string; code: string }> = {
  'Asia/Kolkata': { city: 'Bengaluru', country: 'India', code: 'IN' },
  'Asia/Calcutta': { city: 'Mumbai', country: 'India', code: 'IN' },
  'Asia/Tokyo': { city: 'Tokyo', country: 'Japan', code: 'JP' },
  'Asia/Seoul': { city: 'Seoul', country: 'South Korea', code: 'KR' },
  'Asia/Singapore': { city: 'Singapore', country: 'Singapore', code: 'SG' },
  'Asia/Dubai': { city: 'Dubai', country: 'UAE', code: 'AE' },
  'Asia/Shanghai': { city: 'Shanghai', country: 'China', code: 'CN' },
  'Asia/Hong_Kong': { city: 'Hong Kong', country: 'Hong Kong', code: 'HK' },
  'Asia/Bangkok': { city: 'Bangkok', country: 'Thailand', code: 'TH' },
  'Asia/Jakarta': { city: 'Jakarta', country: 'Indonesia', code: 'ID' },
  'Europe/London': { city: 'London', country: 'UK', code: 'GB' },
  'Europe/Paris': { city: 'Paris', country: 'France', code: 'FR' },
  'Europe/Berlin': { city: 'Berlin', country: 'Germany', code: 'DE' },
  'Europe/Amsterdam': { city: 'Amsterdam', country: 'Netherlands', code: 'NL' },
  'America/New_York': { city: 'New York', country: 'USA', code: 'US' },
  'America/Los_Angeles': { city: 'Los Angeles', country: 'USA', code: 'US' },
  'America/Chicago': { city: 'Chicago', country: 'USA', code: 'US' },
  'America/Toronto': { city: 'Toronto', country: 'Canada', code: 'CA' },
  'America/Sao_Paulo': { city: 'São Paulo', country: 'Brazil', code: 'BR' },
  'Australia/Sydney': { city: 'Sydney', country: 'Australia', code: 'AU' },
  'Australia/Melbourne': { city: 'Melbourne', country: 'Australia', code: 'AU' },
};

export function getCoarseLocation(): LocationData {
  let timezone = 'Asia/Kolkata';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    timezone = 'Asia/Kolkata';
  }

  const mapped = TIMEZONE_TO_CITY[timezone] || {
    city: timezone.split('/')[1]?.replace(/_/g, ' ') || 'Bengaluru',
    country: timezone.split('/')[0] || 'Worldwide',
    code: 'GL',
  };

  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const formattedTime = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
  const isNight = hours < 6 || hours >= 19;

  return {
    city: mapped.city,
    country: mapped.country,
    countryCode: mapped.code,
    timezone,
    formattedTime,
    isNight,
  };
}

export function getCurrentTimeSlot(overrideHour?: number): TimeSlot {
  const hour = overrideHour !== undefined ? overrideHour : new Date().getHours();
  
  if (hour >= 3 && hour < 6) return 'SOLITUDE_DAWN';
  if (hour >= 6 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 20) return 'SUNSET';
  if (hour >= 20 || hour < 0) return 'EVENING';
  return 'MIDNIGHT';
}

export function getEstimatedWeather(): WeatherType {
  // Can be overridden by user atmosphere settings
  const hour = new Date().getHours();
  // Occasional light rain feel in evening/midnight if random seed
  return (hour === 1 || hour === 23) ? 'RAIN' : 'CLEAR';
}
