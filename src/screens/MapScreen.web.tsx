import { Ionicons } from '@expo/vector-icons';
import maplibregl from 'maplibre-gl';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { isFirebaseConfigured } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useDemoBudgetData } from '../hooks/useDemoBudgetData';
import { useExpenses } from '../hooks/useExpenses';
import { isMapTilerConfigured, MAPTILER_KEY } from '../maptilerConfig';
import { ThemeColors, useTheme } from '../theme';
import { formatCurrency, formatDate } from '../utils';

// Web build of the map tab: a real, fullscreen interactive MapLibre GL map (vector tiles, styled
// by MapTiler — noticeably higher production quality than raster OSM/Esri/CARTO tiles) with a
// Google-Maps-style layer switcher, instead of react-native-webview, since that package has no web
// implementation. Also wires up Nominatim (OSM's free geocoding service, unrelated to MapTiler's
// own quota) for a place search bar, requests device geolocation to center on the user by default
// (with a "locate me" button to re-center on demand), and drops a pin for every expense that has a
// location. The native version (src/screens/MapScreen.tsx) stays a simple embed for now —
// react-native-maps + Google Maps is the planned upgrade there once we're building a real
// development client (see CLAUDE.md).

const MAPLIBRE_CSS_URL = 'https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css';
const DEFAULT_CENTER: [number, number] = [35.2137, 31.7683]; // [lng, lat] — Israel
const DEFAULT_ZOOM = 8;
const GEOLOCATION_ZOOM = 15;

type LayerType = 'streets' | 'satellite' | 'topo';

const LAYER_OPTIONS: { key: LayerType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'satellite', label: 'לוויין', icon: 'image-outline' },
  { key: 'streets', label: 'רגיל', icon: 'map-outline' },
  { key: 'topo', label: 'טופוגרפי', icon: 'trail-sign-outline' },
];

// MapTiler's "hybrid" style already bakes road/place labels onto the satellite imagery, so unlike
// the old Esri setup no separate label overlay is needed.
function styleUrlFor(layer: LayerType, mode: 'dark' | 'light') {
  if (layer === 'satellite') return `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`;
  if (layer === 'topo') return `https://api.maptiler.com/maps/topo-v2/style.json?key=${MAPTILER_KEY}`;
  const styleId = mode === 'dark' ? 'streets-v2-dark' : 'streets-v2';
  return `https://api.maptiler.com/maps/${styleId}/style.json?key=${MAPTILER_KEY}`;
}

function createDotElement(color: string) {
  const el = document.createElement('div');
  el.style.width = '18px';
  el.style.height = '18px';
  el.style.borderRadius = '50%';
  el.style.backgroundColor = color;
  el.style.border = '3px solid #FFFFFF';
  el.style.boxShadow = '0 0 6px rgba(0,0,0,0.4)';
  return el;
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
  const mapRef = useRef<maplibregl.Map | null>(null);
  const expenseMarkersRef = useRef<maplibregl.Marker[]>([]);
  const searchMarkerRef = useRef<maplibregl.Marker | null>(null);
  const locationMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeLayer, setActiveLayer] = useState<LayerType>('satellite');
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  // Load MapLibre GL's stylesheet once (matches the installed maplibre-gl package version).
  useEffect(() => {
    if (document.getElementById('maplibre-gl-css')) return;
    const link = document.createElement('link');
    link.id = 'maplibre-gl-css';
    link.rel = 'stylesheet';
    link.href = MAPLIBRE_CSS_URL;
    document.head.appendChild(link);
  }, []);

  const applyLayer = (layer: LayerType) => {
    mapRef.current?.setStyle(styleUrlFor(layer, mode));
    setActiveLayer(layer);
  };

  const locateMe = () => {
    const map = mapRef.current;
    if (!map || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.flyTo({ center: [longitude, latitude], zoom: GEOLOCATION_ZOOM });
        locationMarkerRef.current?.remove();
        locationMarkerRef.current = new maplibregl.Marker({ element: createDotElement(colors.turquoise) })
          .setLngLat([longitude, latitude])
          .setPopup(new maplibregl.Popup({ closeButton: false }).setText('המיקום שלך'))
          .addTo(map);
        setLocating(false);
      },
      () => {
        // Permission denied or unavailable.
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  // Initialize the map once, on the real DOM node behind the View (react-native-web forwards
  // View refs to the underlying <div>), then try to center on the device's real location.
  useEffect(() => {
    if (!isMapTilerConfigured) return;
    const container = mapContainerRef.current as unknown as HTMLElement | null;
    if (!container || mapRef.current) return;

    const map = new maplibregl.Map({
      container,
      style: styleUrlFor('satellite', mode),
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-left');
    mapRef.current = map;
    locateMe();

    return () => {
      map.remove();
      mapRef.current = null;
      expenseMarkersRef.current = [];
      searchMarkerRef.current = null;
      locationMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-apply the streets style when the app's theme toggles (satellite/topo look the same
  // regardless of theme, so only re-fetch when that's actually the active layer).
  useEffect(() => {
    if (activeLayer === 'streets') mapRef.current?.setStyle(styleUrlFor('streets', mode));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Keep the expense pins in sync with the current expense list. Markers are plain DOM overlays,
  // not part of the map's style, so they survive layer switches (setStyle) untouched.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    expenseMarkersRef.current.forEach((marker) => marker.remove());
    expenseMarkersRef.current = expenses
      .filter((expense) => !!expense.location)
      .map((expense) => {
        const popupHtml = `
          <strong>${expense.category}</strong><br/>
          ${formatCurrency(expense.amount)}
          ${expense.note ? `<br/>${expense.note}` : ''}
          <br/><span style="opacity:0.65">${formatDate(expense.date)}</span>
        `;
        return new maplibregl.Marker()
          .setLngLat([expense.location!.lng, expense.location!.lat])
          .setPopup(new maplibregl.Popup().setHTML(popupHtml))
          .addTo(map);
      });
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
    map.flyTo({ center: [lon, lat], zoom: 15 });
    searchMarkerRef.current?.remove();
    searchMarkerRef.current = new maplibregl.Marker()
      .setLngLat([lon, lat])
      .setPopup(new maplibregl.Popup().setText(result.display_name))
      .addTo(map)
      .togglePopup();
    setResults([]);
    setQuery(result.display_name);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    searchMarkerRef.current?.remove();
    searchMarkerRef.current = null;
  };

  if (!isMapTilerConfigured) {
    return (
      <View style={[styles.container, styles.messageContainer]}>
        <Ionicons name="map-outline" size={44} color={colors.subtext} />
        <Text style={styles.messageTitle}>MapTiler לא מוגדר</Text>
        <Text style={styles.messageSubtitle}>הוסיפו EXPO_PUBLIC_MAPTILER_KEY לקובץ .env</Text>
      </View>
    );
  }

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

      <View style={styles.cornerButtonsWrap}>
        {layerMenuOpen && (
          <View style={[styles.layerMenu, styles.shadow]}>
            {LAYER_OPTIONS.map((option) => {
              const selected = option.key === activeLayer;
              return (
                <Pressable
                  key={option.key}
                  style={[styles.layerRow, selected && styles.layerRowSelected]}
                  onPress={() => {
                    applyLayer(option.key);
                    setLayerMenuOpen(false);
                  }}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={selected ? colors.turquoise : colors.text}
                  />
                  <Text style={[styles.layerRowText, selected && styles.layerRowTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          style={[styles.cornerButton, styles.shadow]}
          onPress={() => setLayerMenuOpen((open) => !open)}
        >
          <Ionicons name="layers-outline" size={22} color={colors.text} />
        </Pressable>

        <Pressable style={[styles.cornerButton, styles.shadow]} onPress={locateMe} disabled={locating}>
          {locating ? (
            <ActivityIndicator size="small" color={colors.turquoise} />
          ) : (
            <Ionicons name="locate" size={22} color={colors.turquoise} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    messageContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 12,
    },
    messageTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    messageSubtitle: {
      fontSize: 14,
      color: colors.subtext,
      textAlign: 'center',
    },
    map: {
      flex: 1,
    },
    searchWrap: {
      position: 'absolute',
      top: 64,
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
    cornerButtonsWrap: {
      position: 'absolute',
      bottom: 24,
      right: 16,
      zIndex: 1000,
      alignItems: 'center',
      gap: 12,
    },
    cornerButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    layerMenu: {
      marginBottom: 4,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
      minWidth: 130,
    },
    layerRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    layerRowSelected: {
      backgroundColor: colors.chipBackground,
    },
    layerRowText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
    },
    layerRowTextSelected: {
      color: colors.turquoise,
      fontWeight: '700',
    },
  });
}
