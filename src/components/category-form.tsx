import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Category, createCategory } from '@/db';
import { colors, fontSizes, fonts, layout, radii } from '@/theme';

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
    <View style={styles.wrap}>
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
  wrap: { gap: 14 },
  input: {
    height: layout.chipHeight,
    borderRadius: radii.chip,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    fontFamily: fonts.body,
    fontSize: fontSizes.large,
    color: colors.ink,
  },
  swatches: { flexDirection: 'row', gap: layout.chipGap },
  swatchOuter: {
    width: layout.chipHeight,
    height: layout.chipHeight,
    borderRadius: radii.chip,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: 26, height: 26, borderRadius: 13 },
  addBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addText: { fontFamily: fonts.heading, fontSize: fontSizes.large, color: colors.onPrimary },
});
