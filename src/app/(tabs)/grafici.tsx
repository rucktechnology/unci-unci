import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryFilter } from '@/components/category-filter';
import { PeriodPicker } from '@/components/period-picker';
import { ScreenHeader } from '@/components/screen-header';
import { Category, Expense, getCategories, getExpenses } from '@/db';
import { usePeriod } from '@/hooks/use-period';
import { formatEuroCompact, groupThousands, todayISO } from '@/lib/money';
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
import { colors, fontSizes, fonts, layout, radii } from '@/theme';

type Mode = 'weekly' | 'cumulative';

const PER_LABEL: Record<Granularity, string> = {
  day: '€ per giorno',
  week: '€ per settimana',
  month: '€ per mese',
};

const Y_LABEL_WIDTH = 36; // asse verticale a sinistra dell'area del grafico
const CARD_PAD_X = 20;

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

  const chartWidth =
    screenWidth - 2 * layout.screenPaddingX - 2 * CARD_PAD_X - Y_LABEL_WIDTH;

  /** Proprietà comuni di asse/griglia, con massimo "tondo" in euro. */
  const axisProps = (maxCents: number, points: number, initial: number, end: number) => {
    const max = niceMax(maxCents / 100);
    return {
      width: chartWidth,
      height: 150,
      maxValue: max,
      noOfSections: 2,
      initialSpacing: initial,
      endSpacing: end,
      spacing: points > 1 ? (chartWidth - initial - end) / (points - 1) : 0,
      disableScroll: true,
      hideRules: false,
      rulesType: 'dashed' as const,
      dashWidth: 3,
      dashGap: 4,
      rulesThickness: 1,
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
    thickness: 3,
    dataPointsColor: category.colore,
    dataPointsRadius: 4.5,
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
      ...(last ? { dataPointColor: colors.accent, dataPointRadius: 6 } : {}),
    };
  });

  const rangeLabel = `€ dal ${formatShortDate(range.from)} al ${formatShortDate(range.to)}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader
        subtitle={periodTitle(kind, range)}
        title="Grafici"
        right={
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
        }
      />

      <PeriodPicker {...period} />
      <CategoryFilter categories={categories} excluded={excluded} onToggle={toggle} />

      {mode === 'weekly' ? (
        <>
          <View style={[styles.card, styles.chartCard]}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Andamento settimanale</Text>
              <Text style={styles.cardNote}>{PER_LABEL[weeklyGranularity(range)]}</Text>
            </View>
            {active.length === 0 ? (
              <Text style={styles.empty}>Seleziona almeno una categoria.</Text>
            ) : (
              <LineChart
                key={`w-${weekly.buckets.length}-${active.length}`}
                {...axisProps(weekly.max, weekly.buckets.length, 14, 29)}
                dataSet={weeklyData}
              />
            )}
          </View>

          <View style={[styles.card, styles.totalsCard]}>
            <Text style={styles.cardTitle}>Totale nel periodo</Text>
            {weekly.series.map(({ category, values }) => (
              <View key={category.id} style={styles.totalRow}>
                <View style={styles.totalName}>
                  <View style={[styles.dot, { backgroundColor: category.colore }]} />
                  <Text style={styles.totalText}>{category.nome}</Text>
                </View>
                <Text style={styles.totalText}>
                  {formatEuroCompact(values.reduce((a, b) => a + b, 0))}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <>
          <View style={[styles.card, styles.chartCard]}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Spesa cumulata</Text>
              <Text style={styles.cardNote}>{rangeLabel}</Text>
            </View>
            {active.length === 0 ? (
              <Text style={styles.empty}>Seleziona almeno una categoria.</Text>
            ) : (
              <LineChart
                key={`c-${cumN}`}
                {...axisProps(cumulative.total, cumN, 0, 10)}
                data={cumData}
                color={colors.primary}
                thickness={3.5}
                areaChart
                startFillColor={colors.primary}
                endFillColor={colors.primary}
                startOpacity={0.12}
                endOpacity={0.12}
                dataPointsColor={colors.primary}
                dataPointsRadius={4.5}
              />
            )}
            <View style={styles.legend}>
              <View style={styles.legendLine} />
              <Text style={styles.legendText}>Speso</Text>
            </View>
          </View>

          <View style={[styles.card, styles.stats]}>
            <Stat label="Speso" value={formatEuroCompact(cumulative.total)} />
            <Stat
              label="Media al giorno"
              value={formatEuroCompact(Math.round(cumulative.avg / 100) * 100)}
            />
            <Stat label="Spese" value={String(expenses.length)} />
          </View>
        </>
      )}
    </ScrollView>
    </View>
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
  content: {
    paddingTop: layout.screenTop,
    paddingHorizontal: layout.screenPaddingX,
    paddingBottom: layout.blockGap,
    gap: layout.blockGap,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.chip,
    borderRadius: radii.chip,
  },
  segmentItem: {
    height: layout.chipHeight,
    paddingHorizontal: 14,
    borderRadius: radii.chip,
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.card,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.caption, color: colors.inkMuted },
  segmentTextActive: { color: colors.ink },
  card: { backgroundColor: colors.card, borderRadius: radii.card },
  chartCard: { paddingTop: 18, paddingHorizontal: CARD_PAD_X, paddingBottom: 14, gap: 10 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  cardTitle: { fontFamily: fonts.heading, fontSize: fontSizes.label, color: colors.ink },
  cardNote: { fontFamily: fonts.body, fontSize: fontSizes.small, color: colors.inkMuted, flexShrink: 1 },
  axisText: { fontFamily: fonts.body, fontSize: fontSizes.micro, color: colors.inkMuted },
  empty: { fontFamily: fonts.body, fontSize: fontSizes.body, color: colors.inkMuted, paddingVertical: 24 },
  totalsCard: { paddingVertical: 18, paddingHorizontal: CARD_PAD_X, gap: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalName: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  totalText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.body, color: colors.ink },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendLine: { width: 18, height: 3, borderRadius: 2, backgroundColor: colors.primary },
  legendText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.small, color: colors.inkSoft },
  stats: { flexDirection: 'row', gap: 12, paddingVertical: 16, paddingHorizontal: CARD_PAD_X },
  stat: { flex: 1 },
  statLabel: { fontFamily: fonts.body, fontSize: fontSizes.small, color: colors.inkMuted },
  statValue: { fontFamily: fonts.heading, fontSize: fontSizes.stat, color: colors.ink },
});
