import { AtmosphereTheme, AtmosphereType, TimeSlot, WeatherType } from '../types';

export const ATMOSPHERE_THEMES: Record<string, AtmosphereTheme> = {
  MIDNIGHT: {
    name: 'Midnight',
    skyGradient: ['#050508', '#0b0e1a', '#121629'],
    horizonGlow: 'rgba(99, 102, 241, 0.15)',
    leafColorPrimary: '#0f1f1d',
    leafColorSecondary: '#0a1614',
    leafHighlight: '#1f3833',
    barkColor: '#0a0d14',
    grassColor: '#080d12',
    moonVisible: true,
    sunVisible: false,
    starsOpacity: 0.9,
    cityLightsOpacity: 0.8,
    rainIntensity: 0,
    windSpeed: 1.0,
    fogDensity: 0.2,
    fireflyCount: 28,
    lightingTone: '#94a3b8',
    ambientType: 'night',
  },
  RAIN: {
    name: 'Rainy Night',
    skyGradient: ['#04070d', '#08101d', '#0e1a2b'],
    horizonGlow: 'rgba(56, 189, 248, 0.18)',
    leafColorPrimary: '#091515',
    leafColorSecondary: '#050c0c',
    leafHighlight: '#162e2d',
    barkColor: '#07090f',
    grassColor: '#060a0f',
    moonVisible: false,
    sunVisible: false,
    starsOpacity: 0.1,
    cityLightsOpacity: 0.5,
    rainIntensity: 0.85,
    windSpeed: 1.4,
    fogDensity: 0.65,
    fireflyCount: 4,
    lightingTone: '#38bdf8',
    ambientType: 'rain',
  },
  SUNSET: {
    name: 'Sunset Twilight',
    skyGradient: ['#180b1f', '#3b1236', '#6b203c'],
    horizonGlow: 'rgba(251, 146, 60, 0.45)',
    leafColorPrimary: '#281120',
    leafColorSecondary: '#190a14',
    leafHighlight: '#592038',
    barkColor: '#170c16',
    grassColor: '#150a14',
    moonVisible: true,
    sunVisible: false,
    starsOpacity: 0.3,
    cityLightsOpacity: 0.7,
    rainIntensity: 0,
    windSpeed: 1.1,
    fogDensity: 0.3,
    fireflyCount: 20,
    lightingTone: '#fb923c',
    ambientType: 'sunset',
  },
  MOONLIGHT: {
    name: 'Moonlight Silver',
    skyGradient: ['#02040a', '#060d1f', '#0d1a38'],
    horizonGlow: 'rgba(192, 132, 252, 0.25)',
    leafColorPrimary: '#0e1c27',
    leafColorSecondary: '#081119',
    leafHighlight: '#223c52',
    barkColor: '#080c14',
    grassColor: '#060a12',
    moonVisible: true,
    sunVisible: false,
    starsOpacity: 0.95,
    cityLightsOpacity: 0.65,
    rainIntensity: 0,
    windSpeed: 0.8,
    fogDensity: 0.25,
    fireflyCount: 35,
    lightingTone: '#c084fc',
    ambientType: 'night',
  },
  NEON_NIGHT: {
    name: 'Neon Twilight',
    skyGradient: ['#0b0417', '#1b082f', '#2a0e44'],
    horizonGlow: 'rgba(236, 72, 153, 0.35)',
    leafColorPrimary: '#1a102b',
    leafColorSecondary: '#0f091c',
    leafHighlight: '#3c1d5e',
    barkColor: '#0e0818',
    grassColor: '#0a0612',
    moonVisible: true,
    sunVisible: false,
    starsOpacity: 0.7,
    cityLightsOpacity: 0.95,
    rainIntensity: 0,
    windSpeed: 1.0,
    fogDensity: 0.2,
    fireflyCount: 30,
    lightingTone: '#ec4899',
    ambientType: 'night',
  },
  MORNING: {
    name: 'Morning Mist',
    skyGradient: ['#0b1d30', '#1c3d5a', '#3b6f8c'],
    horizonGlow: 'rgba(253, 224, 71, 0.4)',
    leafColorPrimary: '#173628',
    leafColorSecondary: '#0f241a',
    leafHighlight: '#295c45',
    barkColor: '#1a1818',
    grassColor: '#12241b',
    moonVisible: false,
    sunVisible: true,
    starsOpacity: 0.05,
    cityLightsOpacity: 0.3,
    rainIntensity: 0,
    windSpeed: 0.9,
    fogDensity: 0.45,
    fireflyCount: 8,
    lightingTone: '#fde047',
    ambientType: 'dawn',
  },
  SOLITUDE_DAWN: {
    name: '3 AM Solitude',
    skyGradient: ['#020205', '#060810', '#0a0d18'],
    horizonGlow: 'rgba(129, 140, 248, 0.12)',
    leafColorPrimary: '#081212',
    leafColorSecondary: '#040909',
    leafHighlight: '#102422',
    barkColor: '#05070a',
    grassColor: '#04070a',
    moonVisible: true,
    sunVisible: false,
    starsOpacity: 0.85,
    cityLightsOpacity: 0.4,
    rainIntensity: 0,
    windSpeed: 0.5,
    fogDensity: 0.15,
    fireflyCount: 16,
    lightingTone: '#818cf8',
    ambientType: 'night',
  },
};

export function resolveAtmosphere(
  type: AtmosphereType,
  timeSlot: TimeSlot,
  weather: WeatherType
): AtmosphereTheme {
  if (type !== 'AUTO') {
    return ATMOSPHERE_THEMES[type] || ATMOSPHERE_THEMES.MIDNIGHT;
  }

  // Automatic determination based on real local condition (weather + time + location)
  if (weather === 'RAIN') {
    return ATMOSPHERE_THEMES.RAIN;
  }

  if (weather === 'CLOUDY') {
    return timeSlot === 'MORNING' || timeSlot === 'AFTERNOON'
      ? ATMOSPHERE_THEMES.MORNING
      : ATMOSPHERE_THEMES.SOLITUDE_DAWN;
  }

  if (weather === 'WINDY') {
    return ATMOSPHERE_THEMES.NEON_NIGHT;
  }

  switch (timeSlot) {
    case 'SOLITUDE_DAWN':
      return ATMOSPHERE_THEMES.SOLITUDE_DAWN;
    case 'MORNING':
      return ATMOSPHERE_THEMES.MORNING;
    case 'AFTERNOON':
      return ATMOSPHERE_THEMES.MORNING;
    case 'SUNSET':
      return ATMOSPHERE_THEMES.SUNSET;
    case 'EVENING':
      return ATMOSPHERE_THEMES.MOONLIGHT;
    case 'MIDNIGHT':
    default:
      return ATMOSPHERE_THEMES.MIDNIGHT;
  }
}
