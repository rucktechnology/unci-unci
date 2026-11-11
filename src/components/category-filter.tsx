import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Category } from '@/db';
import { colors, fonts, minTouchSize, radii, spacing } from '@/theme';

type Props = {
  categories: Category[];
  excluded: number[];
  onToggle: (id: number) => void;
};

/** Chip delle categorie attivabili/disattivabili. */
export function CategoryFilter({ categories, excluded, onToggle }: Props) {
  return (
    <View style={styles.filters}>
      {categories.map((c) => {
        const on = !excluded.includes(c.id);
        return (
          <Pressable
            key={c.id}
            onPress={() => onToggle(c.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.filter, { borderColor: on ? c.colore : colors.border }]}>
            <View
              style={[
                styles.dot,
                on
                  ? { backgroundColor: c.colore }
                  : { borderWidth: 2.5, borderColor: colors.inactive },
              ]}
            />
            <Text style={[styles.filterText, !on && styles.filterTextOff]}>{c.nome}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm + 4, marginTop: spacing.md },
  filter: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md + 4,
    borderRadius: radii.pill,
    borderWidth: 2.5,
    backgroundColor: colors.background,
  },
  filterText: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.ink },
  filterTextOff: { color: colors.inactive },
  dot: { width: 14, height: 14, borderRadius: 7 },
});
