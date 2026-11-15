import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { CategoryForm } from '@/components/category-form';
import { TimePill } from '@/components/time-pill';
import { Toast } from '@/components/toast';
import {
  Category,
  createExpense,
  deleteExpense,
  getCategories,
  getExpense,
  updateExpense,
} from '@/db';
import { formatEuro, groupThousands, parseAmountToCents, todayISO } from '@/lib/money';
import {
  DEFAULT_TIME,
  ReminderSettings,
  getReminderSettings,
  setReminderTime,
} from '@/notifications/reminder';
import { colors, fontSizes, fonts, layout, radii } from '@/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'];
const MAX_INT_DIGITS = 7;

function nextInput(current: string, key: string): string {
  if (key === '⌫') return current.slice(0, -1);
  const [int = '', dec] = current.split(',');
  if (key === ',') return current.includes(',') ? current : `${int || '0'},`;
  if (dec !== undefined) return dec.length >= 2 ? current : current + key;
  if (int === '0') return key; // niente zeri iniziali
  return int.length >= MAX_INT_DIGITS ? current : current + key;
}

/** Centesimi -> stringa del tastierino (es. 2450 -> "24,5"). */
function centsToInput(cents: number): string {
  const int = Math.floor(cents / 100);
  const dec = String(cents % 100).padStart(2, '0').replace(/0$/, '');
  return dec ? `${int},${dec}` : String(int);
}

function displayAmount(input: string): string {
  const [int = '', dec] = input.split(',');
  const grouped = groupThousands(int || '0');
  return `€ ${dec === undefined ? grouped : `${grouped},${dec}`}`;
}

export default function Aggiungi() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = id ? Number(id) : null;
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(todayISO);
  const [nota, setNota] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', trigger: 0 });
  const [reminder, setReminder] = useState<ReminderSettings>({ enabled: true, ...DEFAULT_TIME });

  useEffect(() => {
    getReminderSettings().then(setReminder);
  }, []);

  useEffect(() => {
    (async () => {
      const [list, expense] = await Promise.all([
        getCategories(),
        editId !== null ? getExpense(editId) : Promise.resolve(null),
      ]);
      if (editId !== null && !expense) {
        router.back(); // spesa non più esistente
        return;
      }
      setCategories(list);
      if (expense) {
        setSelectedId(expense.category_id);
        setInput(centsToInput(expense.importo));
        setData(expense.data);
        setNota(expense.nota ?? '');
        setNoteOpen(!!expense.nota);
      } else {
        setSelectedId(list[0]?.id ?? null);
      }
    })();
  }, [editId]);

  const cents = parseAmountToCents(input);
  const canSave = selectedId !== null && cents > 0 && !saving;

  const save = async () => {
    if (selectedId === null || cents <= 0) return;
    setSaving(true);
    try {
      const payload = {
        importo: cents,
        category_id: selectedId,
        data,
        nota: nota.trim() || null,
      };
      if (editId !== null) {
        await updateExpense(editId, payload);
        router.back();
        return;
      }
      await createExpense(payload);
      // resta qui: popup di conferma e campi azzerati per una nuova spesa
      setToast((t) => ({ message: `Spesa aggiunta · ${formatEuro(cents)}`, trigger: t.trigger + 1 }));
      setInput('');
      setNota('');
      setNoteOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (editId === null) return;
    Alert.alert('Eliminare la spesa?', 'L\'operazione non si può annullare.', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(editId);
          router.back();
        },
      },
    ]);
  };

  const onCategoryCreated = (c: Category) => {
    setCategories((prev) => [...(prev ?? []), c]);
    setSelectedId(c.id);
  };

  if (categories === null) return <View style={styles.container} />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + layout.blockGap }]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.topRow}>
        <Text style={styles.screenTitle}>{editId !== null ? 'Modifica spesa' : 'Nuova spesa'}</Text>
        <BackButton />
      </View>

      <View style={styles.card}>
        {categories.length === 0 ? (
          <View>
            <Text style={styles.heading}>Crea la tua prima categoria</Text>
            <Text style={styles.hint}>
              Serve almeno una categoria per registrare una spesa.
            </Text>
            <CategoryForm onCreated={onCategoryCreated} />
          </View>
        ) : (
          <>
            <View style={styles.chips}>
              {categories.map((c) => {
                const active = c.id === selectedId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setSelectedId(c.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {c.nome}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.amountRow}>
              <Text
                style={styles.amount}
                numberOfLines={1}
                adjustsFontSizeToFit
                accessibilityLabel={`Importo ${displayAmount(input)}`}>
                {displayAmount(input)}
              </Text>
              <Pressable
                onPress={() => setNoteOpen((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={noteOpen ? 'Chiudi la nota' : 'Aggiungi una nota'}
                accessibilityState={{ expanded: noteOpen }}
                style={styles.noteBtn}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M4 4h16v12l-4 4H4V4zM16 20v-4h4M8 9h8M8 13h4"
                    stroke={colors.ink}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                {nota.trim() !== '' && <View style={styles.noteBadge} />}
              </Pressable>
            </View>

            {noteOpen && (
              <TextInput
                value={nota}
                onChangeText={setNota}
                placeholder="Scrivi una nota…"
                placeholderTextColor={colors.inactive}
                multiline
                maxLength={200}
                autoFocus={editId === null || !nota}
                style={styles.noteInput}
                accessibilityLabel="Nota della spesa"
              />
            )}

            <View style={styles.keypad}>
              {KEYS.map((k) => (
                <Pressable
                  key={k}
                  onPress={() => setInput((cur) => nextInput(cur, k))}
                  accessibilityRole="button"
                  accessibilityLabel={k === '⌫' ? 'Cancella' : k === ',' ? 'Virgola' : k}
                  style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}>
                  <Text style={styles.keyText}>{k === '⌫' ? '←' : k}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={save}
              disabled={!canSave}
              accessibilityRole="button"
              style={[styles.addBtn, !canSave && styles.addBtnDisabled]}>
              <Text style={styles.addText}>{editId !== null ? 'Salva' : 'Aggiungi'}</Text>
            </Pressable>
            {editId !== null && (
              <Pressable onPress={remove} accessibilityRole="button" style={styles.deleteBtn}>
                <Text style={styles.deleteText}>Elimina spesa</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      <View style={styles.reminderCard}>
        <View>
          <Text style={styles.reminderTitle}>Promemoria giornaliero</Text>
          <Text style={styles.reminderSub}>Scegli tu l&apos;ora</Text>
        </View>
        <TimePill
          hour={reminder.hour}
          minute={reminder.minute}
          onChange={async (h, m) => setReminder((await setReminderTime(h, m)).settings)}
        />
      </View>
    </ScrollView>
    <Toast message={toast.message} trigger={toast.trigger} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backdrop },
  content: {
    paddingTop: layout.screenTop,
    paddingHorizontal: layout.screenPaddingX,
    gap: layout.blockGap,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  screenTitle: { fontFamily: fonts.heading, fontSize: fontSizes.stat, color: colors.ink },
  amountRow: { justifyContent: 'center' },
  noteBtn: {
    position: 'absolute',
    right: 0,
    width: layout.chipHeight,
    height: layout.chipHeight,
    borderRadius: radii.chip,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  noteInput: {
    minHeight: 72,
    maxHeight: 140,
    borderRadius: radii.key,
    backgroundColor: colors.background,
    padding: 12,
    textAlignVertical: 'top',
    fontFamily: fonts.body,
    fontSize: fontSizes.large,
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.cardLg,
    padding: 20,
    gap: 14,
  },
  heading: { fontFamily: fonts.heading, fontSize: fontSizes.stat, color: colors.ink },
  hint: { fontFamily: fonts.body, fontSize: fontSizes.body, color: colors.inkMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: layout.chipGap },
  chip: {
    height: layout.chipHeight,
    paddingHorizontal: 16,
    borderRadius: radii.chip,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.body, color: colors.ink },
  chipTextActive: { color: colors.onPrimary },
  amount: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.quickAmount,
    lineHeight: fontSizes.quickAmount * 1.1,
    color: colors.ink,
    textAlign: 'center',
    paddingHorizontal: layout.chipHeight + layout.chipGap, // spazio per il tasto nota
  },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  key: {
    width: '31.5%',
    flexGrow: 1,
    height: 48,
    borderRadius: radii.key,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { opacity: 0.6 },
  keyText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.stat, color: colors.ink },
  addBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addText: { fontFamily: fonts.heading, fontSize: fontSizes.large, color: colors.onPrimary },
  deleteBtn: { height: layout.chipHeight, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.body, color: colors.danger },
  reminderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.cardSm,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  reminderTitle: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.label, color: colors.ink },
  reminderSub: { fontFamily: fonts.body, fontSize: fontSizes.caption, color: colors.inkMuted },
});
