import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
        headerShown: false, 
        tabBarActiveTintColor: '#2196F3', // Màu xanh Logistics
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { 
            paddingBottom: 8, 
            paddingTop: 5,
            height: 65,
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#eee',
        },
        tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
        },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Công việc',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
                name={focused ? "truck-delivery" : "truck-delivery-outline"} 
                size={28} 
                color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
                name={focused ? "view-dashboard" : "view-dashboard-outline"} 
                size={28} 
                color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Lịch sử',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
                name={focused ? "history" : "history"} 
                size={28} 
                color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
                name={focused ? "account-circle" : "account-circle-outline"} 
                size={28} 
                color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}