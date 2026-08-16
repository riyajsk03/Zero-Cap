import { LocationData, TimeSlot, WeatherType } from '../types';

let cachedCoordinates: { lat: number; lon: number } | null = null;
let cachedWeather: WeatherType = 'CLEAR';
let lastWeatherFetch = 0;
let cachedClientIp: string | null = null;
let customCityOverride: { city: string; country: string; countryCode: string; lat?: number; lon?: number } | null = null;
let isIpGeoFetched = false;

// Load persisted custom or detected location from storage
const STORAGE_KEY_LOCATION = 'zero_cap_custom_location_v1';

try {
  const savedLoc = localStorage.getItem(STORAGE_KEY_LOCATION);
  if (savedLoc) {
    customCityOverride = JSON.parse(savedLoc);
  }
} catch {
  // ignore
}

// Fetch exact IP and Geolocation from free IP services
export async function detectRealLocationByIP(): Promise<LocationData | null> {
  if (isIpGeoFetched && customCityOverride) {
    return getCoarseLocation();
  }

  try {
    // 1. Try ipapi.co
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.city && data.country_name) {
        customCityOverride = {
          city: data.city,
          country: data.country_name,
          countryCode: data.country_code || 'GL',
          lat: data.latitude,
          lon: data.longitude,
        };
        if (data.ip) cachedClientIp = data.ip;
        if (data.latitude && data.longitude) {
          cachedCoordinates = { lat: data.latitude, lon: data.longitude };
        }
        localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(customCityOverride));
        isIpGeoFetched = true;
        return getCoarseLocation();
      }
    }
  } catch {
    // try fallback
  }

  try {
    // 2. Fallback ip-api.com
    const res2 = await fetch('http://ip-api.com/json/?fields=status,country,countryCode,city,lat,lon,query', {
      signal: AbortSignal.timeout(4000),
    });
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2 && data2.status === 'success' && data2.city) {
        customCityOverride = {
          city: data2.city,
          country: data2.country || 'India',
          countryCode: data2.countryCode || 'IN',
          lat: data2.lat,
          lon: data2.lon,
        };
        if (data2.query) cachedClientIp = data2.query;
        if (data2.lat && data2.lon) {
          cachedCoordinates = { lat: data2.lat, lon: data2.lon };
        }
        localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(customCityOverride));
        isIpGeoFetched = true;
        return getCoarseLocation();
      }
    }
  } catch {
    // ignore
  }

  return getCoarseLocation();
}

// Allow user to set custom city manually anytime
export function setCustomCity(city: string, country = 'India', countryCode = 'IN') {
  customCityOverride = {
    city: city.trim(),
    country: country.trim(),
    countryCode: countryCode.trim().toUpperCase(),
  };
  try {
    localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(customCityOverride));
  } catch {
    // ignore
  }
}

export function getCoarseLocation(): LocationData {
  let timezone = 'Asia/Kolkata';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    timezone = 'Asia/Kolkata';
  }

  let finalCity = customCityOverride?.city;
  let finalCountry = customCityOverride?.country || 'India';
  let finalCountryCode = customCityOverride?.countryCode || 'IN';

  // If no custom override yet, parse timezone or default to user's local timezone
  if (!finalCity) {
    const tzParts = timezone.split('/');
    finalCity = tzParts[tzParts.length - 1]?.replace(/_/g, ' ') || 'Your City';
    finalCountry = tzParts[0]?.replace(/_/g, ' ') || 'Global';
    finalCountryCode = 'IN';

    // If timezone is Asia/Kolkata or Asia/Calcutta, use India
    if (timezone === 'Asia/Kolkata' || timezone === 'Asia/Calcutta') {
      finalCity = 'Bengaluru';
      finalCountry = 'India';
      finalCountryCode = 'IN';
    }
  }

  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const formattedTime = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${ampm}`;
  const isNight = hours < 6 || hours >= 19;

  return {
    city: finalCity,
    country: finalCountry,
    countryCode: finalCountryCode,
    timezone,
    formattedTime,
    isNight,
  };
}

// Fetch client public IP for accurate presence count and unique visitor tracking
export async function fetchClientPublicIp(): Promise<string> {
  if (cachedClientIp) return cachedClientIp;
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        cachedClientIp = String(data.ip).trim();
        return cachedClientIp;
      }
    }
  } catch {
    // Fallback if blocked
  }
  return '';
}

// Request real client GPS coordinates & reverse geocode to accurate city
if (typeof window !== 'undefined') {
  // Trigger IP auto-lookup immediately
  detectRealLocationByIP().catch(() => {});

  if ('geolocation' in navigator) {
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (pos && pos.coords) {
            cachedCoordinates = {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
            };

            // Reverse geocode with OpenStreetMap Nominatim
            try {
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
                { signal: AbortSignal.timeout(5000) }
              );
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                const addr = geoData.address;
                const detectedCity =
                  addr.city ||
                  addr.town ||
                  addr.village ||
                  addr.suburb ||
                  addr.county ||
                  addr.state_district ||
                  addr.state;
                const detectedCountry = addr.country || 'India';
                const detectedCountryCode = (addr.country_code || 'in').toUpperCase();

                if (detectedCity) {
                  customCityOverride = {
                    city: detectedCity,
                    country: detectedCountry,
                    countryCode: detectedCountryCode,
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                  };
                  localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(customCityOverride));
                }
              }
            } catch {
              // ignore reverse geocoding fail
            }

            fetchLiveWeatherForLocation();
          }
        },
        () => {},
        { timeout: 8000, maximumAge: 600000 }
      );
    } catch {
      // Ignore geolocation errors safely
    }
  }
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
  // Cache for 8 minutes to avoid excessive queries
  if (now - lastWeatherFetch < 8 * 60 * 1000 && cachedWeather !== 'CLEAR') {
    return cachedWeather;
  }

  const lat = cachedCoordinates?.lat ?? customCityOverride?.lat ?? 12.9716;
  const lon = cachedCoordinates?.lon ?? customCityOverride?.lon ?? 77.5946;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,precipitation,rain,wind_speed_10m&timezone=auto`
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
      } else if (wind > 22) {
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

