import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, minTouchSize, spacing } from '@/theme';

/** Rotella con l'ingranaggio, in alto a destra: apre le Impostazioni. */
export function SettingsButton() {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={() => router.push('/impostazioni')}
      accessibilityRole="button"
      accessibilityLabel="Impostazioni"
      style={[styles.button, { top: insets.top + spacing.md }]}>
      <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={3} stroke={colors.ink} strokeWidth={2} />
        <Path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
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
    position: 'absolute',
    right: spacing.lg - 4,
    width: minTouchSize + 8,
    height: minTouchSize + 8,
    borderRadius: (minTouchSize + 8) / 2,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
