
import React from 'react';
import { Stack } from 'expo-router';

export default function CommunityLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="channel/[id]" />
      <Stack.Screen name="create-channel" />
      <Stack.Screen name="user-profile/[id]" />
    </Stack>
  );
}
