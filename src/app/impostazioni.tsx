import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
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
import { TimePill } from '@/components/time-pill';
import {
  DEFAULT_TIME,
  PermissionState,
  ReminderSettings,
  getPermissionState,
  getReminderSettings,
  setReminderEnabled,
  setReminderTime,
} from '@/notifications/reminder';
import { colors, fontSizes, fonts, layout, radii } from '@/theme';

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
      contentContainerStyle={styles.content}
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
            <TimePill
              hour={reminder.hour}
              minute={reminder.minute}
              onChange={(h, m) => applyReminder(setReminderTime(h, m))}
            />
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
  content: {
    paddingTop: 8,
    paddingHorizontal: layout.screenPaddingX,
    paddingBottom: 40,
    gap: layout.blockGap,
  },
  section: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.label,
    color: colors.ink,
    marginBottom: -6,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  empty: { fontFamily: fonts.body, fontSize: fontSizes.caption, color: colors.inkMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    gap: 12,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.rowDivider },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowText: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: fontSizes.label, color: colors.ink },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  reminderText: { flex: 1 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.rowDivider,
  },
  warning: { marginTop: 8, gap: 8 },
  settingsBtn: {
    height: layout.chipHeight,
    borderRadius: radii.chip,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.body, color: colors.ink },
  deleteBtn: {
    height: layout.chipHeight,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  deleteText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.body, color: colors.danger },
});
