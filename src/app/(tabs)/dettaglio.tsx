import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryFilter } from '@/components/category-filter';
import { NoteModal } from '@/components/note-modal';
import { PeriodPicker } from '@/components/period-picker';
import { ScreenHeader } from '@/components/screen-header';
import { Category, Expense, getCategories, getExpenses } from '@/db';
import { usePeriod } from '@/hooks/use-period';
import { formatEuro } from '@/lib/money';
import { formatShortDate, periodTitle } from '@/lib/period';
import { colors, fontSizes, fonts, layout, radii } from '@/theme';

const ROW_HEIGHT = 48;

export default function Dettaglio() {
  const insets = useSafeAreaInsets();
  const period = usePeriod();
  const { kind, range } = period;
  const [categories, setCategories] = useState<Category[]>([]);
  const [excluded, setExcluded] = useState<number[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newestFirst, setNewestFirst] = useState(true);
  const [noteFor, setNoteFor] = useState<Expense | null>(null);

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

  const allExcluded = categories.length > 0 && excluded.length >= categories.length;

  const header = (
    <View style={styles.header}>
      <ScreenHeader
        subtitle={`${periodTitle(kind, range)} · ${expenses.length} ${expenses.length === 1 ? 'spesa' : 'spese'}`}
        title="Dettaglio"
      />
      <PeriodPicker {...period} />
      <CategoryFilter categories={categories} excluded={excluded} onToggle={toggle} />

      <View style={[styles.row, styles.headRow]}>
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
    <FlatList
      contentContainerStyle={styles.content}
      data={rows}
      keyExtractor={(e) => String(e.id)}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View style={[styles.row, styles.lastRow, styles.emptyRow]}>
          <Text style={styles.cell}>
            {allExcluded ? 'Nessuna categoria selezionata.' : 'Nessuna spesa in questo periodo.'}
          </Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const cat = byId.get(item.category_id);
        return (
          <Pressable
            onPress={() => router.push({ pathname: '/aggiungi', params: { id: String(item.id) } })}
            onLongPress={() => setNoteFor(item)}
            accessibilityHint="Tieni premuto per leggere la nota"
            accessibilityRole="button"
            accessibilityLabel={`Modifica spesa ${cat?.nome ?? ''} ${formatEuro(item.importo)}`}
            style={({ pressed }) => [
              styles.row,
              styles.bodyRow,
              index === rows.length - 1 && styles.lastRow,
              pressed && styles.pressed,
            ]}>
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
    <NoteModal expense={noteFor} category={noteFor ? byId.get(noteFor.category_id) : undefined} onClose={() => setNoteFor(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingTop: layout.screenTop,
    paddingHorizontal: layout.screenPaddingX,
    paddingBottom: layout.blockGap,
  },
  header: { gap: layout.blockGap, marginBottom: layout.blockGap },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 14,
  },
  headRow: {
    // la tabella è una card unica: la testata arrotonda gli angoli in alto
    marginBottom: -layout.blockGap,
    paddingVertical: 10,
    borderTopLeftRadius: radii.cardSm,
    borderTopRightRadius: radii.cardSm,
  },
  bodyRow: {
    height: ROW_HEIGHT,
    borderTopWidth: 1,
    borderTopColor: colors.rowDivider,
  },
  lastRow: { borderBottomLeftRadius: radii.cardSm, borderBottomRightRadius: radii.cardSm },
  emptyRow: { height: ROW_HEIGHT * 2, justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.rowDivider },
  pressed: { opacity: 0.6 },
  colDate: { width: 72 },
  colCat: { flex: 1 },
  colAmount: { width: 96, textAlign: 'right' },
  catCell: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  headText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.small, color: colors.inkMuted },
  cell: { fontFamily: fonts.body, fontSize: fontSizes.body, color: colors.ink },
  amount: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.body,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
});
