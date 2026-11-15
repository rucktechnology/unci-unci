import { Modal, Pressable, StyleSheet, Text } from 'react-native';

import type { Category, Expense } from '@/db';
import { formatEuro } from '@/lib/money';
import { formatShortDate } from '@/lib/period';
import { colors, fontSizes, fonts, layout, radii } from '@/theme';

type Props = {
  expense: Expense | null;
  category?: Category;
  onClose: () => void;
};

/** Popup di sola lettura con la nota di una spesa. */
export function NoteModal({ expense, category, onClose }: Props) {
  return (
    <Modal
      visible={expense !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Chiudi nota">
        {/* il tocco dentro la card non chiude il popup */}
        <Pressable style={styles.card} onPress={() => {}}>
          {expense && (
            <>
              <Text style={styles.meta}>
                {formatShortDate(expense.data)} · {category?.nome ?? '—'}
              </Text>
              <Text style={styles.amount}>{formatEuro(expense.importo)}</Text>
              {expense.nota ? (
                <Text style={styles.note} selectable>
                  {expense.nota}
                </Text>
              ) : (
                <Text style={styles.empty}>Nessuna nota per questa spesa.</Text>
              )}
            </>
          )}
          <Pressable onPress={onClose} accessibilityRole="button" style={styles.close}>
            <Text style={styles.closeText}>Chiudi</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingX,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 20,
    gap: 10,
  },
  meta: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.caption, color: colors.inkMuted },
  amount: { fontFamily: fonts.heading, fontSize: fontSizes.stat, color: colors.ink },
  note: { fontFamily: fonts.body, fontSize: fontSizes.large, color: colors.ink, lineHeight: 22 },
  empty: { fontFamily: fonts.body, fontSize: fontSizes.body, color: colors.inkMuted },
  close: {
    height: layout.chipHeight,
    marginTop: 6,
    borderRadius: radii.chip,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.body, color: colors.onPrimary },
});
