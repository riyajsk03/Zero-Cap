import { LocationData, TimeSlot, WeatherType } from '../types';

// Map common timezones to iconic coarse cities and coordinates
const TIMEZONE_TO_CITY: Record<string, { city: string; country: string; code: string; lat: number; lon: number }> = {
  'Asia/Kolkata': { city: 'Bengaluru', country: 'India', code: 'IN', lat: 12.9716, lon: 77.5946 },
  'Asia/Calcutta': { city: 'Mumbai', country: 'India', code: 'IN', lat: 19.076, lon: 72.8777 },
  'Asia/Tokyo': { city: 'Tokyo', country: 'Japan', code: 'JP', lat: 35.6762, lon: 139.6503 },
  'Asia/Seoul': { city: 'Seoul', country: 'South Korea', code: 'KR', lat: 37.5665, lon: 126.978 },
  'Asia/Singapore': { city: 'Singapore', country: 'Singapore', code: 'SG', lat: 1.3521, lon: 103.8198 },
  'Asia/Dubai': { city: 'Dubai', country: 'UAE', code: 'AE', lat: 25.2048, lon: 55.2708 },
  'Asia/Shanghai': { city: 'Shanghai', country: 'China', code: 'CN', lat: 31.2304, lon: 121.4737 },
  'Asia/Hong_Kong': { city: 'Hong Kong', country: 'Hong Kong', code: 'HK', lat: 22.3193, lon: 114.1694 },
  'Asia/Bangkok': { city: 'Bangkok', country: 'Thailand', code: 'TH', lat: 13.7563, lon: 100.5018 },
  'Asia/Jakarta': { city: 'Jakarta', country: 'Indonesia', code: 'ID', lat: -6.2088, lon: 106.8456 },
  'Europe/London': { city: 'London', country: 'UK', code: 'GB', lat: 51.5074, lon: -0.1278 },
  'Europe/Paris': { city: 'Paris', country: 'France', code: 'FR', lat: 48.8566, lon: 2.3522 },
  'Europe/Berlin': { city: 'Berlin', country: 'Germany', code: 'DE', lat: 52.52, lon: 13.405 },
  'Europe/Amsterdam': { city: 'Amsterdam', country: 'Netherlands', code: 'NL', lat: 52.3676, lon: 4.9041 },
  'America/New_York': { city: 'New York', country: 'USA', code: 'US', lat: 40.7128, lon: -74.006 },
  'America/Los_Angeles': { city: 'Los Angeles', country: 'USA', code: 'US', lat: 34.0522, lon: -118.2437 },
  'America/Chicago': { city: 'Chicago', country: 'USA', code: 'US', lat: 41.8781, lon: -87.6298 },
  'America/Toronto': { city: 'Toronto', country: 'Canada', code: 'CA', lat: 43.6532, lon: -79.3832 },
  'America/Sao_Paulo': { city: 'São Paulo', country: 'Brazil', code: 'BR', lat: -23.5505, lon: -46.6333 },
  'Australia/Sydney': { city: 'Sydney', country: 'Australia', code: 'AU', lat: -33.8688, lon: 151.2093 },
  'Australia/Melbourne': { city: 'Melbourne', country: 'Australia', code: 'AU', lat: -37.8136, lon: 144.9631 },
};

let cachedWeather: WeatherType = 'CLEAR';
let lastWeatherFetch = 0;

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
    lat: 12.9716,
    lon: 77.5946,
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

export async function fetchLiveWeatherForLocation(timezone?: string): Promise<WeatherType> {
  const now = Date.now();
  // Cache for 10 minutes to avoid unnecessary network queries
  if (now - lastWeatherFetch < 10 * 60 * 1000) {
    return cachedWeather;
  }

  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  const cityData = TIMEZONE_TO_CITY[tz] || { lat: 12.9716, lon: 77.5946 };

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${cityData.lat}&longitude=${cityData.lon}&current=weather_code,precipitation,rain,wind_speed_10m&timezone=auto`
    );
    if (!res.ok) throw new Error('Weather API request failed');
    const data = await res.json();
    const current = data?.current;
    
    if (current) {
      const code = current.weather_code ?? 0;
      const rain = current.rain ?? current.precipitation ?? 0;
      const wind = current.wind_speed_10m ?? 0;

      // WMO Rain codes: 51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99
      if (rain > 0.1 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) {
        cachedWeather = 'RAIN';
      } else if (wind > 20) {
        cachedWeather = 'WINDY';
      } else if (code === 45 || code === 48 || code === 3) {
        cachedWeather = 'CLOUDY';
      } else {
        cachedWeather = 'CLEAR';
      }
      lastWeatherFetch = now;
      return cachedWeather;
    }
  } catch (err) {
    console.debug('Live weather sync using seasonal fallback:', err);
  }

  // Fallback if network offline
  const hour = new Date().getHours();
  cachedWeather = (hour === 1 || hour === 23) ? 'RAIN' : 'CLEAR';
  lastWeatherFetch = now;
  return cachedWeather;
}

export function getEstimatedWeather(): WeatherType {
  return cachedWeather;
}

