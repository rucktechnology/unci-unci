import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PeriodPicker } from '@/components/period-picker';
import { PeriodSummary, getSummary } from '@/db';
import { usePeriod } from '@/hooks/use-period';
import { formatEuro } from '@/lib/money';
import { periodCountLabel, periodSpentLabel, periodTitle } from '@/lib/period';
import { colors, fonts, minTouchSize, radii, spacing } from '@/theme';

export default function Riepilogo() {
  const insets = useSafeAreaInsets();
  const period = usePeriod();
  const { kind, range } = period;
  const [summary, setSummary] = useState<PeriodSummary | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getSummary(range).then((s) => active && setSummary(s));
      return () => {
        active = false;
      };
    }, [range]),
  );

  const max = Math.max(1, ...(summary?.perCategoria.map((c) => c.totale) ?? [0]));

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.lg - 4,
          paddingBottom: 120,
        }}>
        <Text style={styles.subtitle}>Unci Unci</Text>
        <Text style={styles.title}>{periodTitle(kind, range)}</Text>

        <PeriodPicker {...period} />

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>{periodSpentLabel(kind)}</Text>
          <Text style={styles.heroAmount}>{formatEuro(summary?.totale ?? 0)}</Text>
          <Text style={styles.heroLabel}>{periodCountLabel(kind, summary?.conteggio ?? 0)}</Text>
        </View>

        {summary?.perCategoria.map((c) => (
          <View key={c.category_id} style={styles.catRow}>
            <View style={styles.catHeader}>
              <Text style={styles.catName}>{c.nome}</Text>
              <Text style={styles.catAmount}>{formatEuro(c.totale)}</Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  { backgroundColor: c.colore, width: `${(c.totale / max) * 100}%` },
                ]}
              />
            </View>
          </View>
        ))}

        <Pressable
          onPress={() => router.push('/impostazioni')}
          accessibilityRole="button"
          style={styles.newCat}>
          <Text style={styles.newCatText}>+ Nuova categoria</Text>
        </Pressable>
      </ScrollView>

      <Pressable
        onPress={() => router.push('/aggiungi')}
        accessibilityRole="button"
        style={styles.fab}>
        <Text style={styles.fabText}>+ Spesa</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  subtitle: { fontFamily: fonts.body, fontSize: 16, color: colors.inkMuted },
  title: { fontFamily: fonts.heading, fontSize: 36, color: colors.ink },
  hero: {
    marginTop: spacing.lg - 4,
    backgroundColor: colors.primary,
    borderRadius: radii.card + 8,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  heroLabel: { fontFamily: fonts.body, fontSize: 17, color: colors.onPrimary },
  heroAmount: {
    fontFamily: fonts.heading,
    fontSize: 52,
    color: colors.onPrimary,
    marginVertical: spacing.xs,
  },
  catRow: { marginTop: spacing.md + 4 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  catName: { fontFamily: fonts.headingMedium, fontSize: 20, color: colors.ink },
  catAmount: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink },
  track: {
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.chip,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: radii.pill },
  newCat: {
    minHeight: minTouchSize + 8,
    marginTop: spacing.lg - 4,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.inactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newCatText: { fontFamily: fonts.bodyMedium, fontSize: 17, color: colors.inkMuted },
  fab: {
    position: 'absolute',
    right: spacing.lg - 4,
    bottom: spacing.lg,
    minHeight: minTouchSize + 12,
    paddingHorizontal: spacing.lg + 4,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabText: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink },
});
