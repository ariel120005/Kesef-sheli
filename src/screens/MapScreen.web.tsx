import L from 'leaflet';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { isFirebaseConfigured } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useDemoBudgetData } from '../hooks/useDemoBudgetData';
import { useExpenses } from '../hooks/useExpenses';
import { ThemeColors, useTheme } from '../theme';
import { formatCurrency, formatDate } from '../utils';

// Web build of the map tab: a real interactive Leaflet map with OpenStreetMap tiles (free, no
// API key) instead of react-native-webview, since that package has no web implementation. Also
// wires up Nominatim (OSM's free geocoding service) for a Google-Maps-style place search, and
// drops a pin for every demo expense that has a location. The native version
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

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface Props {
  searchOpen: boolean;
  onCloseSearch: () => void;
}

export function MapScreen({ searchOpen, onCloseSearch }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const firestoreExpenses = useExpenses(user?.uid ?? null);
  const demo = useDemoBudgetData();
  const expenses = isFirebaseConfigured ? firestoreExpenses.expenses : demo.expenses;

  const mapContainerRef = useRef<View>(null);
  const mapRef = useRef<L.Map | null>(null);
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
  // View refs to the underlying <div>).
  useEffect(() => {
    const container = mapContainerRef.current as unknown as HTMLElement | null;
    if (!container || mapRef.current) return;

    const map = L.map(container).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;
    expenseMarkersRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      expenseMarkersRef.current = null;
    };
  }, []);

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
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    searchMarkerRef.current?.remove();
    searchMarkerRef.current = null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>מפה</Text>
      </View>

      {searchOpen && (
        <View style={styles.searchWrap}>
          <View style={[styles.searchInputRow, styles.shadow]}>
            <TextInput
              style={styles.searchInput}
              placeholder="חיפוש מקום או כתובת"
              placeholderTextColor={colors.subtext}
              value={query}
              onChangeText={setQuery}
              textAlign="right"
              autoFocus
            />
            {searching && <ActivityIndicator size="small" color={colors.subtext} />}
            <Pressable
              onPress={() => {
                clearSearch();
                onCloseSearch();
              }}
              style={styles.closeSearchButton}
              hitSlop={8}
            >
              <Text style={styles.closeSearchText}>✕</Text>
            </Pressable>
          </View>

          {results.length > 0 && (
            <View style={[styles.resultsList, styles.shadow]}>
              {results.map((result) => (
                <Pressable
                  key={result.place_id}
                  style={styles.resultRow}
                  onPress={() => selectResult(result)}
                >
                  <Text style={styles.resultText} numberOfLines={2}>
                    {result.display_name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      <View ref={mapContainerRef} style={styles.map} />
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    headerRow: {
      padding: 22,
      paddingBottom: 12,
    },
    header: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'right',
      letterSpacing: 0.2,
    },
    map: {
      flex: 1,
    },
    searchWrap: {
      position: 'absolute',
      top: 70,
      left: 16,
      right: 16,
      zIndex: 20,
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
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingHorizontal: 14,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
    },
    closeSearchButton: {
      padding: 4,
    },
    closeSearchText: {
      color: colors.subtext,
      fontSize: 16,
      fontWeight: '700',
    },
    resultsList: {
      marginTop: 8,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
    },
    resultRow: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    resultText: {
      color: colors.text,
      fontSize: 13,
      textAlign: 'right',
    },
  });
}
