import { Ionicons } from '@expo/vector-icons';
import L from 'leaflet';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { isFirebaseConfigured } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useDemoBudgetData } from '../hooks/useDemoBudgetData';
import { useExpenses } from '../hooks/useExpenses';
import { ThemeColors, useTheme } from '../theme';
import { formatCurrency, formatDate } from '../utils';

// Web build of the map tab: a real, fullscreen interactive Leaflet map with CARTO's free
// basemap tiles (Positron/Voyager for light mode, Dark Matter for dark mode — much closer to a
// Google-Maps-grade look than plain OpenStreetMap's default style) instead of react-native-webview,
// since that package has no web implementation. Also wires up Nominatim (OSM's free geocoding
// service) for a Google-Maps-style place search bar, requests device geolocation to center on the
// user by default, and drops a pin for every expense that has a location. The native version
// (src/screens/MapScreen.tsx) stays a simple embed for now — react-native-maps + Google Maps is
// the planned upgrade there once we're building a real development client (see CLAUDE.md).

// Leaflet's default marker icon assumes its image assets sit next to leaflet.css, which breaks
// once bundled — point them at the same CDN version we'd otherwise load the CSS from.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const DEFAULT_CENTER: [number, number] = [31.7683, 35.2137]; // Israel
const DEFAULT_ZOOM = 8;
const GEOLOCATION_ZOOM = 13;

const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>';

function tileUrlForMode(mode: 'dark' | 'light') {
  return mode === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export function MapScreen() {
  const { colors, mode } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const firestoreExpenses = useExpenses(user?.uid ?? null);
  const demo = useDemoBudgetData();
  const expenses = isFirebaseConfigured ? firestoreExpenses.expenses : demo.expenses;

  const mapContainerRef = useRef<View>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const expenseMarkersRef = useRef<L.LayerGroup | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Load Leaflet's stylesheet once (its own image/font assets aren't bundler-friendly, so this
  // is simpler and more reliable than trying to import the .css file directly).
  useEffect(() => {
    if (document.getElementById('leaflet-css')) return;
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS_URL;
    document.head.appendChild(link);
  }, []);

  // Initialize the map once, on the real DOM node behind the View (react-native-web forwards
  // View refs to the underlying <div>), then try to center on the device's real location.
  useEffect(() => {
    const container = mapContainerRef.current as unknown as HTMLElement | null;
    if (!container || mapRef.current) return;

    const map = L.map(container, { zoomControl: true, attributionControl: true }).setView(
      DEFAULT_CENTER,
      DEFAULT_ZOOM
    );
    const tileLayer = L.tileLayer(tileUrlForMode(mode), {
      subdomains: 'abcd',
      maxZoom: 20,
      detectRetina: true,
      attribution: TILE_ATTRIBUTION,
    }).addTo(map);
    tileLayerRef.current = tileLayer;
    mapRef.current = map;
    expenseMarkersRef.current = L.layerGroup().addTo(map);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], GEOLOCATION_ZOOM);
          L.circleMarker([latitude, longitude], {
            radius: 8,
            weight: 3,
            color: '#FFFFFF',
            fillColor: colors.turquoise,
            fillOpacity: 1,
          })
            .addTo(map)
            .bindPopup('המיקום שלך');
        },
        () => {
          // Permission denied or unavailable — keep the default Israel view.
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      expenseMarkersRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the tile style when the app's theme toggles, without recreating the whole map.
  useEffect(() => {
    tileLayerRef.current?.setUrl(tileUrlForMode(mode));
  }, [mode]);

  // Keep the expense pins in sync with the current expense list.
  useEffect(() => {
    const layer = expenseMarkersRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const expense of expenses) {
      if (!expense.location) continue;
      const popupHtml = `
        <strong>${expense.category}</strong><br/>
        ${formatCurrency(expense.amount)}
        ${expense.note ? `<br/>${expense.note}` : ''}
        <br/><span style="opacity:0.65">${formatDate(expense.date)}</span>
      `;
      L.marker([expense.location.lat, expense.location.lng]).bindPopup(popupHtml).addTo(layer);
    }
  }, [expenses]);

  // Debounced Nominatim search as the user types.
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(timeout);
  }, [query]);

  const selectResult = (result: NominatimResult) => {
    const map = mapRef.current;
    if (!map) return;
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    map.setView([lat, lon], 15);
    searchMarkerRef.current?.remove();
    searchMarkerRef.current = L.marker([lat, lon]).addTo(map).bindPopup(result.display_name).openPopup();
    setResults([]);
    setQuery(result.display_name);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    searchMarkerRef.current?.remove();
    searchMarkerRef.current = null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <View style={[styles.searchInputRow, styles.shadow]}>
          {query.length > 0 ? (
            <Pressable onPress={clearSearch} style={styles.searchIcon} hitSlop={8}>
              <Text style={styles.clearText}>✕</Text>
            </Pressable>
          ) : (
            <View style={styles.searchIcon}>
              <Ionicons name="search" size={18} color={colors.subtext} />
            </View>
          )}
          <TextInput
            style={styles.searchInput}
            placeholder="חפש מיקום..."
            placeholderTextColor={colors.subtext}
            value={query}
            onChangeText={setQuery}
            textAlign="right"
          />
          {searching && <ActivityIndicator size="small" color={colors.subtext} />}
        </View>

        {results.length > 0 && (
          <View style={[styles.resultsList, styles.shadow]}>
            {results.map((result) => (
              <Pressable key={result.place_id} style={styles.resultRow} onPress={() => selectResult(result)}>
                <Ionicons name="location-outline" size={16} color={colors.subtext} />
                <Text style={styles.resultText} numberOfLines={2}>
                  {result.display_name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View ref={mapContainerRef} style={styles.map} />
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    map: {
      flex: 1,
    },
    searchWrap: {
      position: 'absolute',
      top: 16,
      left: 16,
      right: 16,
      zIndex: 1000,
    },
    shadow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    searchInputRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingHorizontal: 8,
      gap: 6,
      height: 52,
    },
    searchIcon: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearText: {
      color: colors.subtext,
      fontSize: 15,
      fontWeight: '700',
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
    },
    resultsList: {
      marginTop: 8,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
    },
    resultRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    resultText: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      textAlign: 'right',
    },
  });
}
