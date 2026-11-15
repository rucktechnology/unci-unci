import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SettingsButton } from '@/components/settings-button';
import { colors, fontSizes, fonts, layout } from '@/theme';

type Props = {
  subtitle: string;
  title: string;
  /** Elementi a destra, prima della rotella delle impostazioni. */
  right?: ReactNode;
};

export function ScreenHeader({ subtitle, title, right }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.right}>
        {right}
        <SettingsButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  texts: { flexShrink: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: layout.chipGap },
  subtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.caption,
    color: colors.inkMuted,
  },
  title: { fontFamily: fonts.heading, fontSize: fontSizes.title, color: colors.ink },
});
