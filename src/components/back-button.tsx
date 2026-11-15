import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, layout, radii } from '@/theme';

/** Piccola freccia per tornare indietro. */
export function BackButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Indietro"
      style={styles.button}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M19 12H5M12 19l-7-7 7-7"
          stroke={colors.ink}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: layout.chipHeight,
    height: layout.chipHeight,
    borderRadius: radii.chip,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
