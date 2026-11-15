import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSizes, fonts, layout } from '@/theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inactive,
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.caption },
        tabBarLabelPosition: 'beside-icon',
        tabBarItemStyle: { justifyContent: 'center', height: layout.chipHeight },
        tabBarStyle: {
          height: layout.tabBarContentHeight + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Riepilogo' }} />
      <Tabs.Screen name="dettaglio" options={{ title: 'Dettaglio' }} />
      <Tabs.Screen name="grafici" options={{ title: 'Grafici' }} />
    </Tabs>
  );
}
