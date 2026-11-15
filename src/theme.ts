export const colors = {
  background: '#F0EEE9', // Cloud Dancer
  card: '#FFFFFF',
  primary: '#1F2A33', // inchiostro: card del totale, pulsanti, chip attivi
  ink: '#1F2A33', // testo
  onPrimary: '#FFFFFF', // testo sopra il primario
  accent: '#C98B52', // caramello: pulsante "+ Spesa"
  inkMuted: '#5F6368', // testo secondario
  inactive: '#6B6F72', // tab e elementi inattivi
  border: '#E4E1DA', // bordi e tracce delle barre
  chip: '#E4E1DA', // chip inattivi
  danger: '#B3261E',
  onPrimaryMuted: '#E6E4DE', // testo secondario sulla card scura
  inkSoft: '#46494D', // testo di pulsanti secondari e legende
  dashed: '#A8A49C', // bordo tratteggiato
  rowDivider: '#EDEAE4', // righe della tabella
  outline: '#B8B4AB', // bordo dei filtri disattivati
  outlineDot: '#8E8B84', // pallino vuoto dei filtri disattivati
  backdrop: '#E7E3DC', // sfondo dell'aggiunta rapida
  scrim: '#1F2A3366', // velo dietro ai popup
  categories: ['#5B83A6', '#C98B52', '#1F2A33', '#8FA38C'],
} as const;

export const fonts = {
  heading: 'Cabin_700Bold', // titoli e importi
  headingMedium: 'Cabin_500Medium',
  body: 'Cabin_400Regular',
  bodyMedium: 'Cabin_500Medium',
  bodySemiBold: 'Cabin_600SemiBold',
} as const;

export const fontSizes = {
  micro: 11, // assi dei grafici
  small: 12,
  caption: 13,
  body: 14,
  label: 15,
  large: 16,
  stat: 20,
  title: 30,
  amount: 44, // totale del Riepilogo
  quickAmount: 48, // importo nell'aggiunta rapida
} as const;

export const radii = {
  key: 14, // tasti, pulsante tratteggiato
  chip: 22, // chip, pulsanti a pillola da 44 px
  cardSm: 20, // tabella, notifiche, promemoria
  card: 24, // card
  cardLg: 28, // card dell'aggiunta rapida
  pill: 999,
} as const;

export const layout = {
  screenPaddingX: 20,
  screenTop: 12, // sotto la status bar
  blockGap: 18, // spazio tra i blocchi di una schermata
  chipGap: 8,
  chipHeight: 44,
  tabBarContentHeight: 54, // 10 di padding + 44 della voce, più l'area di sicurezza
} as const;
