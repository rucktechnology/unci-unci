import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { getSetting, setSetting } from '@/db';

const REMINDER_ID = 'daily-reminder';
const CHANNEL_ID = 'promemoria';
export const REMINDER_URL = '/aggiungi';

export const DEFAULT_TIME = { hour: 20, minute: 30 };

export type ReminderSettings = { enabled: boolean; hour: number; minute: number };
export type PermissionState = 'granted' | 'denied' | 'undetermined';

// Mostra la notifica anche se l'app è aperta.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function getReminderSettings(): Promise<ReminderSettings> {
  const [enabled, time] = await Promise.all([
    getSetting('reminder_enabled'),
    getSetting('reminder_time'),
  ]);
  const match = time?.match(/^(\d{1,2}):(\d{2})$/);
  return {
    enabled: enabled !== '0', // attivo di default
    hour: match ? Number(match[1]) : DEFAULT_TIME.hour,
    minute: match ? Number(match[2]) : DEFAULT_TIME.minute,
  };
}

export async function getPermissionState(): Promise<PermissionState> {
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return 'granted';
  return p.canAskAgain && p.status === 'undetermined' ? 'undetermined' : 'denied';
}

/** Chiede il permesso solo se non è ancora stato deciso. */
async function ensurePermission(): Promise<PermissionState> {
  const current = await getPermissionState();
  if (current !== 'undetermined') return current;
  const p = await Notifications.requestPermissionsAsync();
  return p.granted ? 'granted' : 'denied';
}

async function schedule(hour: number, minute: number) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Promemoria giornaliero',
      importance: AndroidImportance.DEFAULT,
    });
  }
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: 'Cosa hai speso oggi?',
      body: 'Aggiungi una spesa in 5 secondi.',
      data: { url: REMINDER_URL },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

/**
 * Allinea la notifica pianificata alle impostazioni salvate.
 * Chiede il permesso se serve; se negato non pianifica nulla.
 */
export async function syncReminder(): Promise<{ settings: ReminderSettings; permission: PermissionState }> {
  const settings = await getReminderSettings();
  if (!settings.enabled) {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
    return { settings, permission: await getPermissionState() };
  }
  const permission = await ensurePermission();
  if (permission === 'granted') await schedule(settings.hour, settings.minute);
  else await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  return { settings, permission };
}

export async function setReminderEnabled(enabled: boolean) {
  await setSetting('reminder_enabled', enabled ? '1' : '0');
  return syncReminder();
}

export async function setReminderTime(hour: number, minute: number) {
  await setSetting(
    'reminder_time',
    `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
  );
  return syncReminder();
}
