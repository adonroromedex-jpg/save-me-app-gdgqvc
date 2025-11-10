
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import i18n from '@/i18n';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.card,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
  },
  infoBox: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: colors.card,
    lineHeight: 20,
  },
});

export default function CreateChannelScreen() {
  const router = useRouter();
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCreateChannel = async () => {
    if (!channelName.trim()) {
      Alert.alert(i18n.t('common.error'), i18n.t('community.enterChannelName'));
      return;
    }

    if (!channelDescription.trim()) {
      Alert.alert(i18n.t('common.error'), i18n.t('community.enterChannelDescription'));
      return;
    }

    try {
      // Load current user
      const userJson = await SecureStore.getItemAsync('current_user');
      if (!userJson) {
        Alert.alert(i18n.t('common.error'), i18n.t('community.userNotFound'));
        return;
      }
      const currentUser = JSON.parse(userJson);

      // Load existing channels
      const channelsJson = await SecureStore.getItemAsync('chat_channels');
      const channels = channelsJson ? JSON.parse(channelsJson) : [];

      // Create new channel
      const newChannel = {
        id: `channel_${Date.now()}`,
        name: channelName.trim(),
        description: channelDescription.trim(),
        createdBy: currentUser.id,
        createdAt: Date.now(),
        memberCount: 1,
        isPrivate,
      };

      channels.push(newChannel);
      await SecureStore.setItemAsync('chat_channels', JSON.stringify(channels));

      Alert.alert(
        i18n.t('common.success'),
        i18n.t('community.channelCreated'),
        [
          {
            text: i18n.t('common.ok'),
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating channel:', error);
      Alert.alert(i18n.t('common.error'), i18n.t('community.errorCreatingChannel'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.card} />
        </Pressable>
        <Text style={styles.headerTitle}>{i18n.t('community.createChannel')}</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{i18n.t('community.createChannelInfo')}</Text>
        </View>

        <Text style={styles.label}>{i18n.t('community.channelName')}</Text>
        <TextInput
          style={styles.input}
          placeholder={i18n.t('community.channelNamePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={channelName}
          onChangeText={setChannelName}
          maxLength={50}
        />

        <Text style={styles.label}>{i18n.t('community.channelDescription')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={i18n.t('community.channelDescriptionPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={channelDescription}
          onChangeText={setChannelDescription}
          multiline
          maxLength={200}
        />

        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>{i18n.t('community.privateChannel')}</Text>
            <Text style={styles.switchDescription}>
              {i18n.t('community.privateChannelDescription')}
            </Text>
          </View>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.card}
          />
        </View>

        <Pressable style={styles.createButton} onPress={handleCreateChannel}>
          <Text style={styles.createButtonText}>{i18n.t('community.createChannelButton')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
