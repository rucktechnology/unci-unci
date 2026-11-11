import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Category, createCategory } from '@/db';
import { colors, fonts, minTouchSize, radii, spacing } from '@/theme';

export function CategoryForm({ onCreated }: { onCreated: (c: Category) => void }) {
  const [nome, setNome] = useState('');
  const [colore, setColore] = useState<string>(colors.categories[0]);

  const add = async () => {
    const trimmed = nome.trim();
    if (!trimmed) return;
    const created = await createCategory({ nome: trimmed, colore });
    setNome('');
    onCreated(created);
  };

  return (
    <View>
      <TextInput
        value={nome}
        onChangeText={setNome}
        placeholder="Nome"
        placeholderTextColor={colors.inactive}
        style={styles.input}
        returnKeyType="done"
        onSubmitEditing={add}
      />
      <View style={styles.swatches}>
        {colors.categories.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColore(c)}
            accessibilityRole="button"
            accessibilityLabel={`Colore ${c}`}
            accessibilityState={{ selected: colore === c }}
            style={[styles.swatchOuter, colore === c && { borderColor: c }]}>
            <View style={[styles.swatch, { backgroundColor: c }]} />
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={add}
        disabled={!nome.trim()}
        accessibilityRole="button"
        style={[styles.addBtn, !nome.trim() && styles.addBtnDisabled]}>
        <Text style={styles.addText}>Aggiungi</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: minTouchSize + 8,
    borderRadius: radii.pill,
    backgroundColor: colors.chip,
    paddingHorizontal: spacing.lg - 4,
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.ink,
  },
  swatches: { flexDirection: 'row', gap: spacing.sm + 4, marginVertical: spacing.md },
  swatchOuter: {
    width: minTouchSize,
    height: minTouchSize,
    borderRadius: minTouchSize / 2,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: 28, height: 28, borderRadius: 14 },
  addBtn: {
    minHeight: minTouchSize + 8,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addText: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.onPrimary },
});
