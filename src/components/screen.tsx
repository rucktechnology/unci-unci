import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, spacing } from '@/theme';

export function Screen({ title, subtitle }: { title: string; subtitle?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg - 4,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.inkMuted,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 36,
    color: colors.ink,
  },
});
