import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSizes, fonts, layout, radii } from '@/theme';

type Props = {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  /** Colore di sfondo della pillola (Android). */
  background?: string;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Pillola con l'ora (24 h) che apre il selettore dell'orario. */
export function TimePill({ hour, minute, onChange, background = colors.background }: Props) {
  const value = new Date(2000, 0, 1, hour, minute);

  if (Platform.OS !== 'android') {
    return (
      <DateTimePicker
        value={value}
        mode="time"
        display="compact"
        onValueChange={(_e, d) => onChange(d.getHours(), d.getMinutes())}
      />
    );
  }

  return (
    <Pressable
      onPress={() =>
        DateTimePickerAndroid.open({
          value,
          mode: 'time',
          is24Hour: true,
          onValueChange: (_e, d) => onChange(d.getHours(), d.getMinutes()),
        })
      }
      accessibilityRole="button"
      accessibilityLabel={`Ora del promemoria ${pad(hour)}:${pad(minute)}`}
      style={[styles.pill, { backgroundColor: background }]}>
      <Text style={styles.text}>{`${pad(hour)}:${pad(minute)}`}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: layout.chipHeight,
    paddingHorizontal: 18,
    borderRadius: radii.chip,
    justifyContent: 'center',
  },
  text: { fontFamily: fonts.heading, fontSize: fontSizes.large, color: colors.ink },
});
