import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryFilter } from '@/components/category-filter';
import { PeriodPicker } from '@/components/period-picker';
import { Category, Expense, getCategories, getExpenses } from '@/db';
import { usePeriod } from '@/hooks/use-period';
import { formatEuro, groupThousands, todayISO } from '@/lib/money';
import { formatShortDate, periodTitle } from '@/lib/period';
import {
  Granularity,
  cumulativeBuckets,
  daysBetween,
  niceMax,
  sumIn,
  weeklyBuckets,
  weeklyGranularity,
} from '@/lib/series';
import { colors, fonts, minTouchSize, radii, spacing } from '@/theme';

type Mode = 'weekly' | 'cumulative';

const PER_LABEL: Record<Granularity, string> = {
  day: '€ per giorno',
  week: '€ per settimana',
  month: '€ per mese',
};

const Y_LABEL_WIDTH = 44;
const SCREEN_PAD = spacing.lg - 4;
const CARD_PAD = spacing.lg;

export default function Grafici() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const period = usePeriod();
  const { kind, range } = period;
  const [mode, setMode] = useState<Mode>('weekly');
  const [categories, setCategories] = useState<Category[]>([]);
  const [excluded, setExcluded] = useState<number[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const active = useMemo(
    () => categories.filter((c) => !excluded.includes(c.id)),
    [categories, excluded],
  );

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const cats = await getCategories();
        const rows = await getExpenses({
          ...range,
          categoryIds: cats.map((c) => c.id).filter((id) => !excluded.includes(id)),
        });
        if (!alive) return;
        setCategories(cats);
        setExpenses(rows);
      })();
      return () => {
        alive = false;
      };
    }, [range, excluded]),
  );

  const toggle = (id: number) =>
    setExcluded((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const chartWidth = screenWidth - 2 * SCREEN_PAD - 2 * CARD_PAD - Y_LABEL_WIDTH;

  /** Proprietà comuni di asse/griglia, con massimo "tondo" in euro. */
  const axisProps = (maxCents: number, points: number) => {
    const max = niceMax(maxCents / 100);
    const initial = 12;
    const end = 12;
    return {
      width: chartWidth,
      height: 200,
      maxValue: max,
      noOfSections: 2,
      initialSpacing: initial,
      endSpacing: end,
      spacing: points > 1 ? (chartWidth - initial - end) / (points - 1) : 0,
      disableScroll: true,
      hideRules: false,
      rulesType: 'dashed' as const,
      rulesColor: colors.border,
      yAxisThickness: 0,
      xAxisThickness: 0,
      yAxisLabelWidth: Y_LABEL_WIDTH,
      yAxisTextStyle: styles.axisText,
      xAxisLabelTextStyle: styles.axisText,
      formatYLabel: (l: string) => groupThousands(String(Math.round(Number(l)))),
      isAnimated: false,
    };
  };

  const weekly = useMemo(() => {
    const buckets = weeklyBuckets(range);
    const series = active.map((c) => ({
      category: c,
      values: buckets.map((b) => sumIn(expenses, b, c.id)),
    }));
    const max = Math.max(0, ...series.flatMap((s) => s.values));
    return { buckets, series, max };
  }, [range, active, expenses]);

  const cumulative = useMemo(() => {
    const today = todayISO();
    const capped = { from: range.from, to: range.to > today ? (today < range.from ? range.from : today) : range.to };
    const buckets = cumulativeBuckets(capped);
    const values: number[] = [];
    for (const b of buckets) values.push((values[values.length - 1] ?? 0) + sumIn(expenses, b));
    const days = daysBetween(capped.from, capped.to);
    const total = values[values.length - 1] ?? 0;
    return { buckets, values, total, avg: total / Math.max(1, days) };
  }, [range, expenses]);

  const weeklyData = weekly.series.map(({ category, values }) => ({
    data: values.map((v, i) => ({ value: v / 100, label: weekly.buckets[i].label })),
    color: category.colore,
    thickness: 4,
    dataPointsColor: category.colore,
    dataPointsRadius: 6,
  }));

  const cumN = cumulative.buckets.length;
  const labelEvery = Math.max(1, Math.ceil(cumN / 5));
  const cumData = cumulative.values.map((v, i) => {
    const last = i === cumN - 1;
    const show = i === 0 || last || (i % labelEvery === 0 && cumN - 1 - i >= labelEvery / 2);
    return {
      value: v / 100,
      label: show ? cumulative.buckets[i].label : '',
      hideDataPoint: !show,
      ...(last ? { dataPointColor: colors.accent, dataPointRadius: 8 } : {}),
    };
  });

  const rangeLabel = `€ dal ${formatShortDate(range.from)} al ${formatShortDate(range.to)}`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: SCREEN_PAD,
        paddingBottom: spacing.xl,
      }}>
      <Text style={styles.subtitle}>{periodTitle(kind, range)}</Text>
      <Text style={styles.title}>Grafici</Text>
      <View style={styles.segment}>
        {(['weekly', 'cumulative'] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === m }}
            style={[styles.segmentItem, mode === m && styles.segmentActive]}>
            <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>
              {m === 'weekly' ? 'Settimanale' : 'Cumulativo'}
            </Text>
          </Pressable>
        ))}
      </View>


      <PeriodPicker {...period} />
      <CategoryFilter categories={categories} excluded={excluded} onToggle={toggle} />

      {mode === 'weekly' ? (
        <>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Andamento settimanale</Text>
              <Text style={styles.cardNote}>{PER_LABEL[weeklyGranularity(range)]}</Text>
            </View>
            {active.length === 0 ? (
              <Text style={styles.empty}>Seleziona almeno una categoria.</Text>
            ) : (
              <LineChart
                key={`w-${weekly.buckets.length}-${active.length}`}
                {...axisProps(weekly.max, weekly.buckets.length)}
                dataSet={weeklyData}
              />
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Totale nel periodo</Text>
            {weekly.series.map(({ category, values }) => (
              <View key={category.id} style={styles.totalRow}>
                <View style={[styles.dot, { backgroundColor: category.colore }]} />
                <Text style={styles.totalName}>{category.nome}</Text>
                <Text style={styles.totalAmount}>
                  {formatEuro(values.reduce((a, b) => a + b, 0))}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Spesa cumulata</Text>
              <Text style={styles.cardNote}>{rangeLabel}</Text>
            </View>
            {active.length === 0 ? (
              <Text style={styles.empty}>Seleziona almeno una categoria.</Text>
            ) : (
              <LineChart
                key={`c-${cumN}`}
                {...axisProps(cumulative.total, cumN)}
                data={cumData}
                color={colors.primary}
                thickness={4}
                areaChart
                startFillColor={colors.primary}
                endFillColor={colors.primary}
                startOpacity={0.14}
                endOpacity={0.14}
                dataPointsColor={colors.primary}
                dataPointsRadius={6}
              />
            )}
            <View style={styles.legend}>
              <View style={styles.legendLine} />
              <Text style={styles.legendText}>Speso</Text>
            </View>
          </View>

          <View style={[styles.card, styles.stats]}>
            <Stat label="Speso" value={formatEuro(cumulative.total)} />
            <Stat label="Media al giorno" value={formatEuro(Math.round(cumulative.avg))} />
            <Stat label="Spese" value={String(expenses.length)} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  subtitle: { fontFamily: fonts.body, fontSize: 16, color: colors.inkMuted },
  title: { fontFamily: fonts.heading, fontSize: 36, color: colors.ink },
  segment: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: colors.chip,
    borderRadius: radii.pill,
    padding: 0,
  },
  segmentItem: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: colors.card },
  segmentText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.inkMuted },
  segmentTextActive: { color: colors.ink },
  card: {
    marginTop: spacing.lg - 4,
    backgroundColor: colors.card,
    borderRadius: radii.card + 8,
    padding: CARD_PAD,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.ink },
  cardNote: { fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, flexShrink: 1 },
  axisText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted },
  empty: { fontFamily: fonts.body, fontSize: 16, color: colors.inkMuted, paddingVertical: spacing.lg },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, marginTop: spacing.md },
  dot: { width: 16, height: 16, borderRadius: 8 },
  totalName: { flex: 1, fontFamily: fonts.body, fontSize: 18, color: colors.ink },
  totalAmount: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink },
  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, marginTop: spacing.md },
  legendLine: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  legendText: { fontFamily: fonts.body, fontSize: 16, color: colors.ink },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { gap: spacing.xs },
  statLabel: { fontFamily: fonts.body, fontSize: 15, color: colors.inkMuted },
  statValue: { fontFamily: fonts.heading, fontSize: 24, color: colors.ink },
});
