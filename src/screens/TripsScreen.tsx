import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddTripTransactionForm } from '../components/AddTripTransactionForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CreateTripModal } from '../components/CreateTripModal';
import { EditTripTransactionModal } from '../components/EditTripTransactionModal';
import { JoinTripModal } from '../components/JoinTripModal';
import { TripCard } from '../components/TripCard';
import { TripShareCard } from '../components/TripShareCard';
import { TripSplitSummaryCard } from '../components/TripSplitSummaryCard';
import { TripStatsCard } from '../components/TripStatsCard';
import { TripSummaryCard } from '../components/TripSummaryCard';
import { TripTransactionList } from '../components/TripTransactionList';
import { GRADIENTS } from '../constants';
import { isFirebaseConfigured } from '../firebase';
import { useAppSettings } from '../hooks/useAppSettings';
import { useAuth } from '../hooks/useAuth';
import { useDemoBudgetData } from '../hooks/useDemoBudgetData';
import { useTripTransactions } from '../hooks/useTripTransactions';
import { useTrips } from '../hooks/useTrips';
import { ThemeColors, useTheme } from '../theme';
import { Currency, Trip, TripTransaction, TripTransactionType } from '../types';
import { deriveDisplayName } from '../utils';

// Each trip in the list needs its own live transactions to compute gross/net, so the
// Firestore-backed list wraps every trip in its own component instance running its own
// useTripTransactions listener (one hook call per component, so rules-of-hooks is fine).
function FirestoreTripCard({
  uid,
  trip,
  onPress,
  onDelete,
  canDelete,
}: {
  uid: string;
  trip: Trip;
  onPress: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const { transactions } = useTripTransactions(uid, trip);
  return (
    <TripCard trip={trip} transactions={transactions} onPress={onPress} onDelete={onDelete} canDelete={canDelete} />
  );
}

interface Props {
  onBack: () => void;
}

export function TripsScreen({ onBack }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const uid = isFirebaseConfigured ? user?.uid ?? null : null;

  const firestoreTrips = useTrips(uid);
  const firestoreSettings = useAppSettings(uid);
  const demo = useDemoBudgetData();

  const defaultCurrency = isFirebaseConfigured ? firestoreSettings.defaultCurrency : demo.defaultCurrency;
  const currentUid = isFirebaseConfigured ? uid : demo.currentUid;
  const defaultDisplayName = isFirebaseConfigured ? deriveDisplayName(user?.email) : 'אני';

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [pendingDeleteTrip, setPendingDeleteTrip] = useState<Trip | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<TripTransaction | null>(null);
  const [confirmingEndTrip, setConfirmingEndTrip] = useState(false);

  const { trips, tripsLoaded } = isFirebaseConfigured
    ? { trips: firestoreTrips.trips, tripsLoaded: firestoreTrips.loaded }
    : { trips: demo.trips, tripsLoaded: true };

  const selectedTrip = trips.find((t) => t.id === selectedTripId) ?? null;

  const firestoreTripTransactions = useTripTransactions(uid, selectedTrip);

  const transactions = isFirebaseConfigured
    ? firestoreTripTransactions.transactions
    : demo.transactionsByTrip[selectedTripId ?? ''] ?? [];

  const addTrip = (name: string, budget: number) =>
    isFirebaseConfigured ? firestoreTrips.addTrip(name, budget) : demo.addTrip(name, budget);

  const deleteTrip = (trip: Trip) =>
    isFirebaseConfigured ? firestoreTrips.deleteTrip(trip) : demo.deleteTrip(trip.id);

  const endTrip = (trip: Trip) =>
    isFirebaseConfigured ? firestoreTrips.endTrip(trip) : demo.endTrip(trip.id);

  const makeTripShared = (trip: Trip, displayName: string) =>
    isFirebaseConfigured ? firestoreTrips.makeTripShared(trip, displayName) : demo.makeTripShared(trip.id, displayName);

  const joinTripByCode = (code: string, displayName: string) =>
    isFirebaseConfigured ? firestoreTrips.joinTripByCode(code, displayName) : demo.joinTripByCode(code, displayName);

  const canDeleteTrip = (trip: Trip) => !trip.isShared || trip.ownerUid === currentUid;

  const addTransaction = (
    type: TripTransactionType,
    amount: number,
    note: string,
    originalAmount: number | null,
    originalCurrency: Currency | null,
    shared: boolean
  ) => {
    if (!selectedTripId || !selectedTrip) return;
    const paidByUid = shared ? currentUid : null;
    const splitAmongUids = shared ? (selectedTrip.participants ?? []).map((p) => p.uid) : null;
    if (isFirebaseConfigured) {
      firestoreTripTransactions.addTransaction(
        type,
        amount,
        note,
        originalAmount,
        originalCurrency,
        paidByUid,
        splitAmongUids
      );
    } else {
      demo.addTripTransaction(
        selectedTripId,
        type,
        amount,
        note,
        originalAmount,
        originalCurrency,
        paidByUid,
        splitAmongUids
      );
    }
  };

  const updateTransaction = (
    id: string,
    type: TripTransactionType,
    amount: number,
    note: string,
    originalAmount: number | null,
    originalCurrency: Currency | null
  ) => {
    if (!selectedTripId) return;
    if (isFirebaseConfigured) {
      firestoreTripTransactions.updateTransaction(id, type, amount, note, originalAmount, originalCurrency);
    } else {
      demo.updateTripTransaction(selectedTripId, id, type, amount, note, originalAmount, originalCurrency);
    }
  };

  const deleteTransaction = (id: string) => {
    if (!selectedTripId) return;
    if (isFirebaseConfigured) firestoreTripTransactions.deleteTransaction(id);
    else demo.deleteTripTransaction(selectedTripId, id);
  };

  if (isFirebaseConfigured && !user) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.header}>טיולים</Text>
        </View>
        <View style={styles.messageContainer}>
          <Ionicons name="lock-closed-outline" size={44} color={colors.subtext} />
          <Text style={styles.messageTitle}>יש להתחבר כדי לראות את הנתונים</Text>
          <Text style={styles.messageSubtitle}>לחצו על אייקון הפרופיל כדי להתחבר או להירשם</Text>
        </View>
      </View>
    );
  }

  if (!tripsLoaded) {
    return (
      <View style={styles.messageContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (selectedTrip) {
    const ended = !!selectedTrip.endedAt;
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => setSelectedTripId(null)} style={styles.backButton} hitSlop={8}>
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.header}>{selectedTrip.name}</Text>
            {ended && (
              <View style={styles.endedBadge}>
                <Text style={styles.endedBadgeText}>הטיול הסתיים</Text>
              </View>
            )}
          </View>

          <TripSummaryCard trip={selectedTrip} transactions={transactions} />

          <TripStatsCard trip={selectedTrip} transactions={transactions} />

          <TripShareCard
            trip={selectedTrip}
            currentUid={currentUid ?? ''}
            defaultDisplayName={defaultDisplayName}
            onShare={(displayName) => makeTripShared(selectedTrip, displayName)}
          />

          <TripSplitSummaryCard trip={selectedTrip} transactions={transactions} currentUid={currentUid ?? ''} />

          {ended ? (
            <Text style={styles.endedNotice}>
              הטיול הסתיים — לא ניתן להוסיף תנועות חדשות, אך ניתן עדיין לצפות ולערוך את הקיימות.
            </Text>
          ) : (
            <>
              <Pressable style={styles.endTripButton} onPress={() => setConfirmingEndTrip(true)}>
                <Ionicons name="flag-outline" size={18} color={colors.text} />
                <Text style={styles.endTripButtonText}>סיים טיול</Text>
              </Pressable>

              <AddTripTransactionForm
                defaultCurrency={defaultCurrency}
                isSharedTrip={!!selectedTrip.isShared}
                participantCount={selectedTrip.participants?.length ?? 0}
                onAdd={addTransaction}
              />
            </>
          )}

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

        <ConfirmDialog
          visible={confirmingEndTrip}
          title="סיום טיול"
          message="לסיים את הטיול? יוצג סיכום סופי ולא ניתן יהיה להוסיף תנועות חדשות."
          confirmLabel="סיים טיול"
          onCancel={() => setConfirmingEndTrip(false)}
          onConfirm={() => {
            setConfirmingEndTrip(false);
            endTrip(selectedTrip);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
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

        <View style={styles.actionsRow}>
          <Pressable onPress={() => setCreateModalVisible(true)} style={styles.actionButtonFlex}>
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createButton}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>טיול חדש</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => setJoinModalVisible(true)} style={[styles.actionButtonFlex, styles.joinButtonOuter]}>
            <Ionicons name="enter-outline" size={18} color={colors.text} />
            <Text style={styles.joinButtonOuterText}>הצטרף לטיול</Text>
          </Pressable>
        </View>

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
              canDelete={canDeleteTrip(trip)}
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
              canDelete={canDeleteTrip(trip)}
            />
          ))
        )}
      </ScrollView>

      <CreateTripModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSave={addTrip}
      />

      <JoinTripModal
        visible={joinModalVisible}
        defaultDisplayName={defaultDisplayName}
        onClose={() => setJoinModalVisible(false)}
        onJoin={joinTripByCode}
      />

      <ConfirmDialog
        visible={!!pendingDeleteTrip}
        title="מחיקת טיול"
        message={pendingDeleteTrip ? `למחוק את הטיול "${pendingDeleteTrip.name}" וכל התנועות שלו?` : ''}
        confirmLabel="מחיקה"
        onCancel={() => setPendingDeleteTrip(null)}
        onConfirm={() => {
          if (pendingDeleteTrip) deleteTrip(pendingDeleteTrip);
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
      flexShrink: 1,
    },
    backButton: {
      borderRadius: 10,
      padding: 4,
    },
    endedBadge: {
      backgroundColor: colors.chipBackground,
      borderRadius: 20,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    endedBadgeText: {
      color: colors.subtext,
      fontSize: 11,
      fontWeight: '700',
    },
    endedNotice: {
      color: colors.subtext,
      fontSize: 12,
      textAlign: 'right',
      marginBottom: 20,
    },
    endTripButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 14,
      paddingVertical: 13,
      marginBottom: 20,
      backgroundColor: colors.chipBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    endTripButtonText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 14,
    },
    demoBadge: {
      backgroundColor: colors.warning,
      borderRadius: 20,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    demoBadgeText: {
      color: '#000000',
      fontSize: 11,
      fontWeight: '700',
    },
    demoNotice: {
      color: colors.subtext,
      fontSize: 12,
      textAlign: 'right',
      marginBottom: 24,
    },
    actionsRow: {
      flexDirection: 'row-reverse',
      gap: 12,
      marginBottom: 20,
    },
    actionButtonFlex: {
      flex: 1,
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
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
    },
    joinButtonOuter: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 14,
      paddingVertical: 15,
      backgroundColor: colors.chipBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    joinButtonOuterText: {
      color: colors.text,
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
