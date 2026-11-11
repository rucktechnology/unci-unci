import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import {
  Category,
  countExpensesByCategory,
  deleteCategory,
  getCategories,
} from '@/db';
import { CategoryForm } from '@/components/category-form';
import {
  DEFAULT_TIME,
  PermissionState,
  ReminderSettings,
  getPermissionState,
  getReminderSettings,
  setReminderEnabled,
  setReminderTime,
} from '@/notifications/reminder';
import { colors, fonts, minTouchSize, radii, spacing } from '@/theme';

export default function Impostazioni() {
  const [categories, setCategories] = useState<Category[]>([]);

  const [reminder, setReminder] = useState<ReminderSettings>({ enabled: true, ...DEFAULT_TIME });
  const [permission, setPermission] = useState<PermissionState>('undetermined');

  const load = useCallback(async () => {
    setCategories(await getCategories());
    setReminder(await getReminderSettings());
    setPermission(await getPermissionState());
  }, []);

  const applyReminder = async (action: Promise<{ settings: ReminderSettings; permission: PermissionState }>) => {
    const res = await action;
    setReminder(res.settings);
    setPermission(res.permission);
  };

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeLabel = `${pad(reminder.hour)}:${pad(reminder.minute)}`;
  const timeValue = new Date(2000, 0, 1, reminder.hour, reminder.minute);

  const openAndroidTimePicker = () =>
    DateTimePickerAndroid.open({
      value: timeValue,
      mode: 'time',
      is24Hour: true,
      onValueChange: (_e, d) => applyReminder(setReminderTime(d.getHours(), d.getMinutes())),
    });

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const remove = async (c: Category) => {
    const n = await countExpensesByCategory(c.id);
    const extra =
      n > 0 ? `\n\nVerranno eliminate anche ${n} ${n === 1 ? 'spesa' : 'spese'}.` : '';
    Alert.alert('Eliminare la categoria?', `“${c.nome}”${extra}`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          await deleteCategory(c.id);
          await load();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.lg - 4,
        paddingBottom: spacing.xl,
      }}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.section}>Promemoria giornaliero</Text>
      <View style={styles.card}>
        <View style={styles.reminderRow}>
          <View style={styles.reminderText}>
            <Text style={styles.rowText}>Cosa hai speso oggi?</Text>
            <Text style={styles.empty}>
              {reminder.enabled ? 'Scegli l’ora' : 'Disattivato'}
            </Text>
          </View>
          <Switch
            value={reminder.enabled}
            onValueChange={(v) => applyReminder(setReminderEnabled(v))}
            trackColor={{ true: colors.primary, false: colors.chip }}
            accessibilityLabel="Promemoria giornaliero"
          />
        </View>

        {reminder.enabled && (
          <View style={styles.timeRow}>
            <Text style={styles.rowText}>Ora</Text>
            {Platform.OS === 'android' ? (
              <Pressable
                onPress={openAndroidTimePicker}
                accessibilityRole="button"
                style={styles.timePill}>
                <Text style={styles.timeText}>{timeLabel}</Text>
              </Pressable>
            ) : (
              <DateTimePicker
                value={timeValue}
                mode="time"
                display="compact"
                onValueChange={(_e, d) =>
                  applyReminder(setReminderTime(d.getHours(), d.getMinutes()))
                }
              />
            )}
          </View>
        )}

        {reminder.enabled && permission === 'denied' && (
          <View style={styles.warning}>
            <Text style={styles.empty}>
              Le notifiche sono bloccate: consentile dalle impostazioni del telefono per ricevere
              il promemoria.
            </Text>
            <Pressable
              onPress={() => Linking.openSettings()}
              accessibilityRole="button"
              style={styles.settingsBtn}>
              <Text style={styles.settingsBtnText}>Apri impostazioni</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Text style={styles.section}>Categorie</Text>
      <View style={styles.card}>
        {categories.length === 0 ? (
          <Text style={styles.empty}>Nessuna categoria. Aggiungine una qui sotto.</Text>
        ) : (
          categories.map((c, i) => (
            <View key={c.id} style={[styles.row, i > 0 && styles.rowBorder]}>
              <View style={[styles.dot, { backgroundColor: c.colore }]} />
              <Text style={styles.rowText}>{c.nome}</Text>
              <Pressable
                onPress={() => remove(c)}
                accessibilityRole="button"
                accessibilityLabel={`Elimina ${c.nome}`}
                style={styles.deleteBtn}>
                <Text style={styles.deleteText}>Elimina</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <Text style={styles.section}>Nuova categoria</Text>
      <View style={styles.card}>
        <CategoryForm onCreated={load} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: {
    fontFamily: fonts.headingMedium,
    fontSize: 20,
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.md,
  },
  empty: { fontFamily: fonts.body, fontSize: 16, color: colors.inkMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: minTouchSize + 8,
    gap: spacing.sm + 4,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  dot: { width: 16, height: 16, borderRadius: 8 },
  rowText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 17, color: colors.ink },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reminderText: { flex: 1 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: minTouchSize + 8,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timePill: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.lg - 4,
    borderRadius: radii.pill,
    backgroundColor: colors.chip,
    justifyContent: 'center',
  },
  timeText: { fontFamily: fonts.heading, fontSize: 20, color: colors.ink },
  warning: { marginTop: spacing.sm, gap: spacing.sm },
  settingsBtn: {
    minHeight: minTouchSize,
    borderRadius: radii.pill,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.ink },
  deleteBtn: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  deleteText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.danger },
});
