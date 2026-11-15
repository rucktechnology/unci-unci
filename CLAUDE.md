# Unci Unci

App mobile per tenere traccia delle proprie spese. Semplice e minimale.
Il nome viene dal goblin della banca di Harry Potter.

## Stack
- Expo (React Native) con TypeScript, expo-router per la navigazione
- Dati salvati solo sul telefono con expo-sqlite
- Notifiche locali con expo-notifications
- Grafici: react-native-gifted-charts
- Font: Cabin, con expo-font e @expo-google-fonts/cabin
- Test su telefono con Expo Go (avvio con: npx expo start --tunnel)

## Regole importanti
- Nessun backend e nessun login. Tutti i dati restano sul telefono.
- Isola l'accesso ai dati in un livello separato (src/db/), così in futuro
  si potrà aggiungere la sincronizzazione cloud senza riscrivere l'app.
- Le categorie sono create dall'utente: si parte con zero categorie.
- Lingua dell'interfaccia: italiano. Importi in euro, formato "€ 1.234,50".
- Nessuna funzione di previsione o budget per ora.
- Dopo ogni installazione di pacchetti, ricordami di riavviare Expo con --clear.

## Design
I mockup sono nella cartella design/. Seguili fedelmente.
Tutti i valori vanno in src/theme.ts, mai scritti direttamente nei componenti.

Colori (palette ispirata a Pantone 2026 Cloud Dancer):
- Sfondo: #F0EEE9 (Cloud Dancer). Card: #FFFFFF
- Inchiostro e colore primario: #1F2A33 (testi, card del totale, pulsanti)
- Accento: #C98B52 (caramello), per il pulsante "+ Spesa" con testo #1F2A33
- Testo secondario: #5F6368. Elementi inattivi (tab): #6B6F72
- Bordi e chip inattivi: #E4E1DA
- Colori per le categorie nuove, in rotazione: #5B83A6, #C98B52, #1F2A33, #8FA38C

Font: Cabin per tutto (400, 500, 600, 700). Titoli e importi in 700.
Stile: angoli molto arrotondati (card 24, pulsanti a pillola), tanto spazio bianco,
aree toccabili di almeno 44 px, niente ombre pesanti.

## Schermate
Tab bar in basso con quattro voci: Riepilogo, Dettaglio, Grafici, Impostazioni.
- Riepilogo: totale del periodo, totale per categoria con barre, pulsante "+ Spesa"
- Dettaglio: tabella delle spese (data, categoria, importo), con filtri per periodo e categoria
- Grafici: interruttore Settimanale / Cumulativo, grafico a linee, filtri per categoria
- Aggiunta rapida: categoria, importo con tastierino, pulsante Aggiungi
- Impostazioni: gestione categorie e ora della notifica giornaliera