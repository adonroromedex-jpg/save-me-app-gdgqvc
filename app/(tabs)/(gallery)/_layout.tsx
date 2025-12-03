
import React from 'react';
import { Stack } from 'expo-router';

export default function GalleryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#f9f9f9',
        },
        headerTintColor: '#212121',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Protected Gallery',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="content-detail"
        options={{
          title: 'Content Details',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="protection-report"
        options={{
          title: 'Protection Report',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
