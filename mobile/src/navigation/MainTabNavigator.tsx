import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MapScreen from "../screens/MapScreen";
import SearchScreen from "../screens/SearchScreen";
import ChatListScreen from "../screens/ChatListScreen";
import ProfileScreen from "../screens/ProfileScreen";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  Map: "🗺️",
  Search: "🔍",
  Chats: "💬",
  Profile: "👤",
};

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name as keyof MainTabParamList]}</Text>,
        tabBarActiveTintColor: "#D32F2F",
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} options={{ title: "Map" }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: "Search" }} />
      <Tab.Screen name="Chats" component={ChatListScreen} options={{ title: "Chats" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}
