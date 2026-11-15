import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Category } from '@/db';
import { colors, fontSizes, fonts, layout, radii } from '@/theme';

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
            style={[styles.filter, on ? { borderColor: c.colore } : styles.filterOff]}>
            <View style={[styles.dot, on ? { backgroundColor: c.colore } : styles.dotOff]} />
            <Text style={[styles.filterText, !on && styles.filterTextOff]}>{c.nome}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: layout.chipGap },
  filter: {
    height: layout.chipHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: radii.chip,
    borderWidth: 2,
    backgroundColor: colors.card,
  },
  filterOff: {
    borderWidth: 1.5,
    borderColor: colors.outline,
    backgroundColor: 'transparent',
  },
  filterText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.body, color: colors.ink },
  filterTextOff: { color: colors.inkMuted },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotOff: { borderWidth: 2, borderColor: colors.outlineDot },
});
