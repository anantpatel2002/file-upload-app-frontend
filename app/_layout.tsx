// app/_layout.js
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Optional, for icons

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hide the header for all tabs
        tabBarActiveTintColor: '#007AFF',
      }}
    >
      <Tabs.Screen
        name="index" // This links to app/index.js
        options={{
          title: 'Upload', // Tab bar title
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cloud-upload-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="files" // This links to app/files.js
        options={{
          title: 'Files', // Tab bar title
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}