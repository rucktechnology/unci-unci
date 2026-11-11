# Unci Unci

App mobile per tenere traccia delle proprie spese. Semplice e minimale.
Il nome viene dal goblin della banca di Harry Potter.

## Stack
- Expo (React Native) con TypeScript, expo-router per la navigazione
- Dati salvati solo sul telefono con expo-sqlite
- Notifiche locali con expo-notifications
- Grafici: react-native-gifted-charts
- Test su telefono con Expo Go

## Regole importanti
- Nessun backend e nessun login. Tutti i dati restano sul telefono.
- Isola l'accesso ai dati in un livello separato (src/db/), così in futuro
  si potrà aggiungere la sincronizzazione cloud senza riscrivere l'app.
- Le categorie sono create dall'utente: si parte con zero categorie.
- Lingua dell'interfaccia: italiano. Importi in euro, formato "€ 1.234,50".
- Nessuna funzione di previsione/budget per ora.

## Design
Colori (da mettere in src/theme.ts, mai scritti direttamente nei componenti):
- Smeraldo #0F7B5F (primario), oro #E0A526 (accento, pulsante +)
- Inchiostro #14231C (testo), sfondo #F6F7F3, card bianche
- Colori categorie: #0F7B5F, #E0A526, #2B3A34, #A8DCCB
Font: Space Grotesk per titoli e importi, Inter per il testo.
Stile: angoli molto arrotondati (card 24, pulsanti pillola), tanto spazio bianco,
pulsanti alti almeno 44 px. I mockup sono nella cartella design/.

## Schermate
Riepilogo, Dettaglio (tabella), Grafici (settimanale + cumulativo,
con filtri per categoria e periodo), Aggiunta rapida, Impostazioni.
Tab bar in basso con quattro voci: Riepilogo, Dettaglio, Grafici, Impostazioni.