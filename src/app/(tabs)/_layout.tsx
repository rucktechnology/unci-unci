import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { SettingsButton } from '@/components/settings-button';

import { colors, fonts } from '@/theme';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontFamily: fonts.bodySemiBold, fontSize: 14 },
        tabBarLabelPosition: 'beside-icon',
        tabBarItemStyle: { justifyContent: 'center', minHeight: 44 },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Riepilogo' }} />
      <Tabs.Screen name="dettaglio" options={{ title: 'Dettaglio' }} />
      <Tabs.Screen name="grafici" options={{ title: 'Grafici' }} />
    </Tabs>
    <SettingsButton />
    </View>
  );
}
