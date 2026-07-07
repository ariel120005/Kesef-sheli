export const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY ?? '';

export const isMapTilerConfigured = MAPTILER_KEY.length > 0;
