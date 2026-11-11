import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryFilter } from '@/components/category-filter';
import { PeriodPicker } from '@/components/period-picker';
import { Category, Expense, getCategories, getExpenses } from '@/db';
import { usePeriod } from '@/hooks/use-period';
import { formatEuro } from '@/lib/money';
import { formatShortDate, periodTitle } from '@/lib/period';
import { colors, fonts, minTouchSize, radii, spacing } from '@/theme';

export default function Dettaglio() {
  const insets = useSafeAreaInsets();
  const period = usePeriod();
  const { kind, range } = period;
  const [categories, setCategories] = useState<Category[]>([]);
  const [excluded, setExcluded] = useState<number[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newestFirst, setNewestFirst] = useState(true);

  const categoryIds = useMemo(
    () => categories.filter((c) => !excluded.includes(c.id)).map((c) => c.id),
    [categories, excluded],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const cats = await getCategories();
        const rows = await getExpenses({
          ...range,
          categoryIds: cats.map((c) => c.id).filter((id) => !excluded.includes(id)),
        });
        if (!active) return;
        setCategories(cats);
        setExpenses(rows);
      })();
      return () => {
        active = false;
      };
    }, [range, excluded]),
  );

  const rows = useMemo(
    () => (newestFirst ? expenses : [...expenses].reverse()),
    [expenses, newestFirst],
  );
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const toggle = (id: number) =>
    setExcluded((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const header = (
    <View>
      <Text style={styles.subtitle}>
        {periodTitle(kind, range)} · {expenses.length} {expenses.length === 1 ? 'spesa' : 'spese'}
      </Text>
      <Text style={styles.title}>Dettaglio</Text>

      <PeriodPicker {...period} />

      <CategoryFilter categories={categories} excluded={excluded} onToggle={toggle} />

      <View style={[styles.tableRow, styles.tableHead]}>
        <Pressable
          onPress={() => setNewestFirst((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="Ordina per data"
          style={styles.colDate}>
          <Text style={styles.headText}>Data {newestFirst ? '↓' : '↑'}</Text>
        </Pressable>
        <Text style={[styles.headText, styles.colCat]}>Categoria</Text>
        <Text style={[styles.headText, styles.colAmount]}>Importo</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.lg - 4,
        paddingBottom: spacing.xl,
      }}
      data={rows}
      keyExtractor={(e) => String(e.id)}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View style={[styles.tableRow, styles.emptyRow]}>
          <Text style={styles.empty}>
            {categoryIds.length === 0 && categories.length > 0
              ? 'Nessuna categoria selezionata.'
              : 'Nessuna spesa in questo periodo.'}
          </Text>
        </View>
      }
      ListFooterComponent={<View style={styles.tableEnd} />}
      renderItem={({ item }) => {
        const cat = byId.get(item.category_id);
        return (
          <Pressable
            onPress={() => router.push({ pathname: '/aggiungi', params: { id: String(item.id) } })}
            accessibilityRole="button"
            accessibilityLabel={`Modifica spesa ${cat?.nome ?? ''} ${formatEuro(item.importo)}`}
            style={({ pressed }) => [styles.tableRow, styles.bodyRow, pressed && styles.pressed]}>
            <Text style={[styles.cell, styles.colDate]}>{formatShortDate(item.data)}</Text>
            <View style={[styles.colCat, styles.catCell]}>
              <View style={[styles.dot, { backgroundColor: cat?.colore ?? colors.inactive }]} />
              <Text style={styles.cell} numberOfLines={1}>
                {cat?.nome ?? '—'}
              </Text>
            </View>
            <Text style={[styles.amount, styles.colAmount]}>{formatEuro(item.importo)}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  subtitle: { fontFamily: fonts.body, fontSize: 16, color: colors.inkMuted },
  title: { fontFamily: fonts.heading, fontSize: 36, color: colors.ink },
  dot: { width: 14, height: 14, borderRadius: 7 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md + 4,
  },
  tableHead: {
    marginTop: spacing.lg - 4,
    minHeight: minTouchSize + 8,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableEnd: {
    height: spacing.sm,
    backgroundColor: colors.card,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },
  bodyRow: {
    minHeight: minTouchSize + 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: { opacity: 0.6 },
  emptyRow: { minHeight: 96, justifyContent: 'center' },
  empty: { fontFamily: fonts.body, fontSize: 16, color: colors.inkMuted },
  colDate: { flex: 2, justifyContent: 'center', minHeight: minTouchSize },
  colCat: { flex: 3 },
  colAmount: { flex: 3, textAlign: 'right' },
  catCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4 },
  headText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.inkMuted },
  cell: { fontFamily: fonts.body, fontSize: 17, color: colors.ink },
  amount: { fontFamily: fonts.heading, fontSize: 17, color: colors.ink },
});
