import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryForm } from '@/components/category-form';
import {
  Category,
  createExpense,
  deleteExpense,
  getCategories,
  getExpense,
  updateExpense,
} from '@/db';
import { groupThousands, parseAmountToCents, todayISO } from '@/lib/money';
import { colors, fonts, minTouchSize, radii, spacing } from '@/theme';

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
  const [nota, setNota] = useState<string | null>(null);

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
        setNota(expense.nota);
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
      const payload = { importo: cents, category_id: selectedId, data, nota };
      if (editId !== null) await updateExpense(editId, payload);
      else await createExpense(payload);
      router.back();
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: spacing.lg,
        paddingHorizontal: spacing.lg - 4,
        paddingBottom: insets.bottom + spacing.lg,
      }}
      keyboardShouldPersistTaps="handled">
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

            <Text style={styles.amount} accessibilityLabel={`Importo ${displayAmount(input)}`}>
              {displayAmount(input)}
            </Text>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card + 8,
    padding: spacing.lg,
  },
  heading: { fontFamily: fonts.heading, fontSize: 24, color: colors.ink },
  hint: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.inkMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm + 4 },
  chip: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.lg - 4,
    borderRadius: radii.pill,
    backgroundColor: colors.chip,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.ink },
  chipTextActive: { color: colors.onPrimary },
  amount: {
    fontFamily: fonts.heading,
    fontSize: 52,
    color: colors.ink,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm + 4 },
  key: {
    width: '31.5%',
    flexGrow: 1,
    height: 56,
    borderRadius: radii.card - 8,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { opacity: 0.6 },
  keyText: { fontFamily: fonts.headingMedium, fontSize: 24, color: colors.ink },
  addBtn: {
    minHeight: minTouchSize + 8,
    marginTop: spacing.lg - 4,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  deleteBtn: {
    minHeight: minTouchSize + 8,
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.danger },
  addText: { fontFamily: fonts.bodySemiBold, fontSize: 18, color: colors.onPrimary },
});
