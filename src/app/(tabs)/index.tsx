import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PeriodPicker } from '@/components/period-picker';
import { ScreenHeader } from '@/components/screen-header';
import { PeriodSummary, getSummary } from '@/db';
import { usePeriod } from '@/hooks/use-period';
import { formatEuroCompact } from '@/lib/money';
import { periodCountLabel, periodSpentLabel, periodTitle } from '@/lib/period';
import { colors, fontSizes, fonts, layout, radii } from '@/theme';

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader subtitle="Unci Unci" title={periodTitle(kind, range)} />

        <PeriodPicker {...period} />

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>{periodSpentLabel(kind)}</Text>
          <Text style={styles.heroAmount}>{formatEuroCompact(summary?.totale ?? 0)}</Text>
          <Text style={styles.heroLabel}>{periodCountLabel(kind, summary?.conteggio ?? 0)}</Text>
        </View>

        <View style={styles.list}>
          {summary?.perCategoria.map((c) => (
            <View key={c.category_id} style={styles.catRow}>
              <View style={styles.catHeader}>
                <Text style={styles.catText}>{c.nome}</Text>
                <Text style={styles.catText}>{formatEuroCompact(c.totale)}</Text>
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
        </View>
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
  content: {
    paddingTop: layout.screenTop,
    paddingHorizontal: layout.screenPaddingX,
    paddingBottom: 100,
    gap: layout.blockGap,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radii.card,
    padding: 20,
    gap: 10,
  },
  heroLabel: { fontFamily: fonts.body, fontSize: fontSizes.caption, color: colors.onPrimaryMuted },
  heroAmount: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.amount,
    lineHeight: fontSizes.amount,
    color: colors.onPrimary,
  },
  list: { gap: 16 },
  catRow: { gap: 6 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  catText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.label, color: colors.ink },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  bar: { height: 6, borderRadius: 3 },
  newCat: {
    height: layout.chipHeight,
    borderRadius: radii.key,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.dashed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newCatText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.body, color: colors.inkSoft },
  fab: {
    position: 'absolute',
    right: layout.screenPaddingX,
    bottom: 16,
    height: 56,
    paddingHorizontal: 22,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fabText: { fontFamily: fonts.heading, fontSize: fontSizes.large, color: colors.ink },
});
