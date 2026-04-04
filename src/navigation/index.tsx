import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { SinkingFundsScreen } from '../screens/SinkingFundsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { FAB } from '../components/FAB';
import { COLORS } from '../lib/utils';

const Tab = createBottomTabNavigator();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  Dashboard: { active: 'home', inactive: 'home-outline' },
  Transactions: { active: 'list', inactive: 'list-outline' },
  Schedule: { active: 'calendar', inactive: 'calendar-outline' },
  Funds: { active: 'wallet', inactive: 'wallet-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

export function AppNavigator() {
  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: COLORS.card,
              borderTopColor: COLORS.border,
              borderTopWidth: 1,
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarActiveTintColor: COLORS.accent,
            tabBarInactiveTintColor: COLORS.muted,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            tabBarIcon: ({ focused, color, size }) => {
              const icons = TAB_ICONS[route.name];
              if (!icons) return null;
              const iconName = focused ? icons.active : icons.inactive;
              return <Ionicons name={iconName} size={size - 2} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Transactions" component={TransactionsScreen} />
          <Tab.Screen name="Schedule" component={ScheduleScreen} />
          <Tab.Screen name="Funds" component={SinkingFundsScreen} options={{ title: 'Sinking Funds' }} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>

        <FAB />
      </View>
    </NavigationContainer>
  );
}
