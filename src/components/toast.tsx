import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSizes, fonts, layout, radii } from '@/theme';

type Props = {
  message: string;
  /** Cambiando questo numero il popup riappare (0 = mai mostrato). */
  trigger: number;
};

const SHOW_MS = 2200;

/** Popup in alto: scende, resta qualche secondo, poi scivola di nuovo verso l'alto. */
export function Toast({ message, trigger }: Props) {
  const insets = useSafeAreaInsets();
  const hidden = -(insets.top + 120);
  const [y] = useState(() => new Animated.Value(-1000));

  useEffect(() => {
    if (trigger === 0) return;
    y.stopAnimation();
    y.setValue(hidden);
    Animated.sequence([
      Animated.timing(y, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.delay(SHOW_MS),
      Animated.timing(y, { toValue: hidden, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [trigger, y, hidden]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.toast, { top: insets.top + layout.chipGap, transform: [{ translateY: y }] }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: layout.screenPaddingX,
    right: layout.screenPaddingX,
    zIndex: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radii.cardSm,
    backgroundColor: colors.primary,
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  text: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.large, color: colors.onPrimary },
});
