import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddTripTransactionForm } from '../components/AddTripTransactionForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CreateTripModal } from '../components/CreateTripModal';
import { EditTripTransactionModal } from '../components/EditTripTransactionModal';
import { TripCard } from '../components/TripCard';
import { TripStatsCard } from '../components/TripStatsCard';
import { TripTransactionList } from '../components/TripTransactionList';
import { GRADIENTS } from '../constants';
import { DEMO_TRIPS, DEMO_TRIP_TRANSACTIONS } from '../demoData';
import { isFirebaseConfigured } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useTripTransactions } from '../hooks/useTripTransactions';
import { useTrips } from '../hooks/useTrips';
import { ThemeColors, useTheme } from '../theme';
import { Trip, TripTransaction, TripTransactionType } from '../types';

function useDemoTripsData() {
  const [trips, setTrips] = useState<Trip[]>(DEMO_TRIPS);
  const [transactionsByTrip, setTransactionsByTrip] =
    useState<Record<string, TripTransaction[]>>(DEMO_TRIP_TRANSACTIONS);

  const addTrip = (name: string, budget: number) => {
    const id = `demo-trip-${Date.now()}`;
    setTrips((prev) => [{ id, name, budget, createdAt: new Date().toISOString() }, ...prev]);
    setTransactionsByTrip((prev) => ({ ...prev, [id]: [] }));
  };

  const deleteTrip = (id: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
    setTransactionsByTrip((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addTransaction = (tripId: string, type: TripTransactionType, amount: number, note: string) => {
    const tx: TripTransaction = {
      id: `demo-tx-${Date.now()}`,
      type,
      amount,
      note,
      date: new Date().toISOString(),
    };
    setTransactionsByTrip((prev) => ({ ...prev, [tripId]: [tx, ...(prev[tripId] ?? [])] }));
  };

  const updateTransaction = (
    tripId: string,
    id: string,
    type: TripTransactionType,
    amount: number,
    note: string
  ) => {
    setTransactionsByTrip((prev) => ({
      ...prev,
      [tripId]: (prev[tripId] ?? []).map((t) => (t.id === id ? { ...t, type, amount, note } : t)),
    }));
  };

  const deleteTransaction = (tripId: string, id: string) => {
    setTransactionsByTrip((prev) => ({
      ...prev,
      [tripId]: (prev[tripId] ?? []).filter((t) => t.id !== id),
    }));
  };

  return { trips, transactionsByTrip, addTrip, deleteTrip, addTransaction, updateTransaction, deleteTransaction };
}

// Each trip in the list needs its own live transactions to compute gross/net, so the
// Firestore-backed list wraps every trip in its own component instance running its own
// useTripTransactions listener (one hook call per component, so rules-of-hooks is fine).
function FirestoreTripCard({
  uid,
  trip,
  onPress,
  onDelete,
}: {
  uid: string;
  trip: Trip;
  onPress: () => void;
  onDelete: () => void;
}) {
  const { transactions } = useTripTransactions(uid, trip.id);
  return <TripCard trip={trip} transactions={transactions} onPress={onPress} onDelete={onDelete} />;
}

export function TripsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const uid = isFirebaseConfigured ? user?.uid ?? null : null;

  const firestoreTrips = useTrips(uid);
  const demo = useDemoTripsData();

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [pendingDeleteTrip, setPendingDeleteTrip] = useState<Trip | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<TripTransaction | null>(null);

  const firestoreTripTransactions = useTripTransactions(uid, selectedTripId);

  const { trips, tripsLoaded } = isFirebaseConfigured
    ? { trips: firestoreTrips.trips, tripsLoaded: firestoreTrips.loaded }
    : { trips: demo.trips, tripsLoaded: true };

  const selectedTrip = trips.find((t) => t.id === selectedTripId) ?? null;

  const transactions = isFirebaseConfigured
    ? firestoreTripTransactions.transactions
    : demo.transactionsByTrip[selectedTripId ?? ''] ?? [];

  const addTrip = (name: string, budget: number) =>
    isFirebaseConfigured ? firestoreTrips.addTrip(name, budget) : demo.addTrip(name, budget);

  const deleteTrip = (id: string) =>
    isFirebaseConfigured ? firestoreTrips.deleteTrip(id) : demo.deleteTrip(id);

  const addTransaction = (type: TripTransactionType, amount: number, note: string) => {
    if (!selectedTripId) return;
    if (isFirebaseConfigured) firestoreTripTransactions.addTransaction(type, amount, note);
    else demo.addTransaction(selectedTripId, type, amount, note);
  };

  const updateTransaction = (id: string, type: TripTransactionType, amount: number, note: string) => {
    if (!selectedTripId) return;
    if (isFirebaseConfigured) firestoreTripTransactions.updateTransaction(id, type, amount, note);
    else demo.updateTransaction(selectedTripId, id, type, amount, note);
  };

  const deleteTransaction = (id: string) => {
    if (!selectedTripId) return;
    if (isFirebaseConfigured) firestoreTripTransactions.deleteTransaction(id);
    else demo.deleteTransaction(selectedTripId, id);
  };

  if (isFirebaseConfigured && !user) {
    return (
      <View style={styles.messageContainer}>
        <Ionicons name="lock-closed-outline" size={44} color={colors.subtext} />
        <Text style={styles.messageTitle}>יש להתחבר כדי לראות את הנתונים</Text>
        <Text style={styles.messageSubtitle}>עברו לטאב "פרופיל" כדי להתחבר או להירשם</Text>
      </View>
    );
  }

  if (!tripsLoaded) {
    return (
      <View style={styles.messageContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (selectedTrip) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => setSelectedTripId(null)} style={styles.backButton} hitSlop={8}>
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.header}>{selectedTrip.name}</Text>
          </View>

          <TripStatsCard trip={selectedTrip} transactions={transactions} />

          <AddTripTransactionForm onAdd={addTransaction} />

          <TripTransactionList
            transactions={transactions}
            onDelete={deleteTransaction}
            onEdit={setEditingTransaction}
          />
        </ScrollView>

        <EditTripTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={updateTransaction}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>טיולים</Text>
          {!isFirebaseConfigured && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>מצב הדגמה</Text>
            </View>
          )}
        </View>

        {!isFirebaseConfigured && (
          <Text style={styles.demoNotice}>
            הנתונים כאן הם לדוגמה בלבד ולא נשמרים — התחברו כדי לעבוד עם נתונים אמיתיים
          </Text>
        )}

        <Pressable onPress={() => setCreateModalVisible(true)} style={styles.createButtonWrap}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createButton}
          >
            <Ionicons name="add" size={20} color="#0A0A0F" />
            <Text style={styles.createButtonText}>טיול חדש</Text>
          </LinearGradient>
        </Pressable>

        {trips.length === 0 ? (
          <Text style={styles.emptyText}>עדיין אין טיולים — צרו טיול חדש כדי להתחיל</Text>
        ) : isFirebaseConfigured && uid ? (
          trips.map((trip) => (
            <FirestoreTripCard
              key={trip.id}
              uid={uid}
              trip={trip}
              onPress={() => setSelectedTripId(trip.id)}
              onDelete={() => setPendingDeleteTrip(trip)}
            />
          ))
        ) : (
          trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              transactions={demo.transactionsByTrip[trip.id] ?? []}
              onPress={() => setSelectedTripId(trip.id)}
              onDelete={() => setPendingDeleteTrip(trip)}
            />
          ))
        )}
      </ScrollView>

      <CreateTripModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSave={addTrip}
      />

      <ConfirmDialog
        visible={!!pendingDeleteTrip}
        title="מחיקת טיול"
        message={pendingDeleteTrip ? `למחוק את הטיול "${pendingDeleteTrip.name}" וכל התנועות שלו?` : ''}
        confirmLabel="מחיקה"
        onCancel={() => setPendingDeleteTrip(null)}
        onConfirm={() => {
          if (pendingDeleteTrip) deleteTrip(pendingDeleteTrip.id);
          setPendingDeleteTrip(null);
        }}
      />
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    messageContainer: {
      flex: 1,
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
    content: {
      padding: 22,
      paddingBottom: 40,
    },
    headerRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    },
    header: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'right',
      letterSpacing: 0.2,
    },
    backButton: {
      borderRadius: 10,
      padding: 4,
    },
    demoBadge: {
      backgroundColor: colors.warning,
      borderRadius: 20,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    demoBadgeText: {
      color: '#0A0A0F',
      fontSize: 11,
      fontWeight: '700',
    },
    demoNotice: {
      color: colors.subtext,
      fontSize: 12,
      textAlign: 'right',
      marginBottom: 24,
    },
    createButtonWrap: {
      marginBottom: 20,
    },
    createButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 14,
      paddingVertical: 15,
    },
    createButtonText: {
      color: '#0A0A0F',
      fontWeight: '700',
      fontSize: 15,
    },
    emptyText: {
      color: colors.subtext,
      fontSize: 14,
      textAlign: 'center',
      paddingVertical: 30,
    },
  });
}
