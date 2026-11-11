import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import * as Notifications from 'expo-notifications';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';

import { REMINDER_URL, syncReminder } from '@/notifications/reminder';
import { colors, fonts } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  const ready = loaded || !!error;

  // Allinea la notifica giornaliera all'avvio (chiede il permesso la prima volta).
  useEffect(() => {
    if (ready) syncReminder().catch(() => {});
  }, [ready]);

  // Toccando la notifica si apre l'aggiunta rapida (anche ad app chiusa).
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const key = response.notification.request.identifier + response.notification.date;
    if (handled.current === key) return;
    handled.current = key;
    if (response.notification.request.content.data?.url === REMINDER_URL) {
      router.push(REMINDER_URL);
    }
  }, [ready, response]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="aggiungi" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="impostazioni"
          options={{
            headerShown: true,
            title: 'Impostazioni',
            headerBackTitle: 'Indietro',
            headerShadowVisible: false,
            headerTintColor: colors.ink,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { fontFamily: fonts.heading, fontSize: 20 },
          }}
        />
      </Stack>
    </>
  );
}
