import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { PeriodState } from '@/hooks/use-period';
import { PeriodKind, formatShortDate, fromISODate, toISODate } from '@/lib/period';
import { colors, fonts, minTouchSize, radii, spacing } from '@/theme';

const PERIODS: { kind: PeriodKind; label: string }[] = [
  { kind: '7d', label: '7 giorni' },
  { kind: 'month', label: 'Mese' },
  { kind: 'year', label: 'Anno' },
  { kind: 'range', label: 'Intervallo' },
];

export function PeriodPicker({ kind, setKind, custom, setCustom }: PeriodState) {
  const setBound = (which: 'from' | 'to', d: Date) => {
    const iso = toISODate(d);
    setCustom((cur) => {
      const next = { ...cur, [which]: iso };
      // mantiene l'intervallo valido
      return next.from > next.to ? { from: iso, to: iso } : next;
    });
  };

  const openAndroidPicker = (which: 'from' | 'to') =>
    DateTimePickerAndroid.open({
      value: fromISODate(custom[which]),
      mode: 'date',
      onValueChange: (_e, d) => setBound(which, d),
    });

  return (
    <View>
      <View style={styles.chips}>
        {PERIODS.map((p) => {
          const active = p.kind === kind;
          return (
            <Pressable
              key={p.kind}
              onPress={() => setKind(p.kind)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {kind === 'range' && (
        <View style={styles.rangeRow}>
          {(['from', 'to'] as const).map((which) => (
            <View key={which} style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>{which === 'from' ? 'Dal' : 'Al'}</Text>
              {Platform.OS === 'android' ? (
                <Pressable
                  onPress={() => openAndroidPicker(which)}
                  accessibilityRole="button"
                  style={styles.rangeBtn}>
                  <Text style={styles.rangeBtnText}>{formatShortDate(custom[which])}</Text>
                </Pressable>
              ) : (
                <DateTimePicker
                  value={fromISODate(custom[which])}
                  mode="date"
                  display="compact"
                  onValueChange={(_e, d) => setBound(which, d)}
                />
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm + 4, marginTop: spacing.md },
  chip: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.lg - 4,
    borderRadius: radii.pill,
    backgroundColor: colors.chip,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.ink },
  chipText: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.ink },
  chipTextActive: { color: colors.onPrimary },
  rangeRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  rangeItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rangeLabel: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.inkMuted },
  rangeBtn: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.chip,
    justifyContent: 'center',
  },
  rangeBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.ink },
});
