import { Tabs } from "expo-router";
import { LayoutDashboard, Dumbbell, Crosshair } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";
import { useTheme } from "@/contexts/Theme";

import Colors from "@/constants/colors";

export default function TabLayout() {
  const { theme } = useTheme();
  
  const tabBarActiveTintColor = theme?.primary ?? Colors.light.tint;
  const tabBarInactiveTintColor = theme?.isDark ? '#64748B' : '#999';
  const tabBarBackground = theme?.isDark ? '#0F172A' : '#fff';
  const tabBarBorder = theme?.isDark ? '#334155' : '#e0e0e0';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tabBarActiveTintColor,
        tabBarInactiveTintColor: tabBarInactiveTintColor,
        headerShown: false,
        tabBarStyle: Platform.OS === 'web' ? {
          backgroundColor: tabBarBackground,
          borderTopWidth: 1,
          borderTopColor: tabBarBorder,
          paddingBottom: 0,
          height: 60,
        } : {
          backgroundColor: tabBarBackground,
          borderTopColor: tabBarBorder,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: "Workout",
          tabBarIcon: ({ color }) => <Dumbbell color={color} />,
        }}
      />
      <Tabs.Screen
        name="targets"
        options={{
          title: "Targets",
          tabBarIcon: ({ color }) => <Crosshair color={color} />,
        }}
      />
    </Tabs>
  );
}
