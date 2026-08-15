export type AtmosphereType = 
  | 'AUTO' 
  | 'MIDNIGHT' 
  | 'RAIN' 
  | 'SUNSET' 
  | 'MOONLIGHT' 
  | 'NEON_NIGHT' 
  | 'MORNING' 
  | 'SOLITUDE_DAWN';

export type WeatherType = 'CLEAR' | 'RAIN' | 'CLOUDY' | 'WINDY';

export type TimeSlot = 
  | 'MORNING'       // 06:00 - 11:59
  | 'AFTERNOON'     // 12:00 - 16:59
  | 'SUNSET'        // 17:00 - 19:59
  | 'EVENING'       // 20:00 - 23:59
  | 'MIDNIGHT'      // 00:00 - 02:59
  | 'SOLITUDE_DAWN' // 03:00 - 05:59 (ultra quiet 3-5 AM)

export interface LocationData {
  city: string;
  country: string;
  countryCode: string;
  timezone: string;
  formattedTime: string;
  isNight: boolean;
}

export interface SongTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  playlistIndex: number;
  totalTracks: number;
  thumbnail?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  displayName: string;
  message: string;
  country: string;
  city: string;
  countryCode?: string;
  timestamp: string;
  isSystem?: boolean;
  systemType?: 'join' | 'weather' | 'track' | 'quiet' | 'name';
  reported?: boolean;
}

export interface UserSession {
  sessionId: string;
  displayName: string;
  city: string;
  country: string;
  countryCode: string;
  joinedAt: number;
  isMuted?: boolean;
}

export interface PresenceStats {
  totalLive: number;
  cityLive: number;
  countryLive: number;
}

export interface AtmosphereTheme {
  name: string;
  skyGradient: string[]; // [top, middle, bottom]
  horizonGlow: string;
  leafColorPrimary: string;
  leafColorSecondary: string;
  leafHighlight: string;
  barkColor: string;
  grassColor: string;
  moonVisible: boolean;
  sunVisible: boolean;
  starsOpacity: number;
  cityLightsOpacity: number;
  rainIntensity: number; // 0 to 1
  windSpeed: number; // multiplier
  fogDensity: number;
  fireflyCount: number;
  lightingTone: string;
  ambientType: 'night' | 'rain' | 'dawn' | 'afternoon' | 'sunset';
}
