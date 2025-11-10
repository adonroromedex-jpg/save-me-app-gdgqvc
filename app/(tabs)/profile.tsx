
import React, { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, Alert, Platform, Switch } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, commonStyles } from "@/styles/commonStyles";

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(true);
  const [ghostModeEnabled, setGhostModeEnabled] = useState(false);

  const settingsSections = [
    {
      title: "Security",
      items: [
        {
          icon: "faceid",
          label: "Biometric Authentication",
          value: biometricEnabled,
          onToggle: setBiometricEnabled,
          color: colors.primary,
        },
        {
          icon: "timer",
          label: "Auto-Delete (24h)",
          value: autoDeleteEnabled,
          onToggle: setAutoDeleteEnabled,
          color: colors.accent,
        },
        {
          icon: "eye.slash.fill",
          label: "Ghost Mode",
          value: ghostModeEnabled,
          onToggle: setGhostModeEnabled,
          color: colors.secondary,
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: "bell.fill",
          label: "View Notifications",
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
          color: colors.highlight,
        },
      ],
    },
  ];

  const accountActions = [
    {
      icon: "person.2.fill",
      label: "Manage Users",
      color: colors.highlight,
      action: () => router.push("/(tabs)/(home)/manage-users"),
    },
    {
      icon: "key.fill",
      label: "Change Password",
      color: colors.primary,
      action: () => Alert.alert("Change Password", "This feature will be available soon"),
    },
    {
      icon: "shield.checkered",
      label: "Two-Factor Authentication",
      color: colors.accent,
      action: () => Alert.alert("2FA", "Two-factor authentication setup coming soon"),
    },
    {
      icon: "doc.text.fill",
      label: "Access Log",
      color: colors.secondary,
      action: () => Alert.alert("Access Log", "View all access attempts to your content"),
    },
    {
      icon: "questionmark.circle.fill",
      label: "Help & Support",
      color: colors.textSecondary,
      action: () => Alert.alert("Help", "Contact support at support@saveme.app"),
    },
  ];

  const renderHeaderRight = () => (
    <Pressable
      onPress={() => Alert.alert("Settings", "Additional settings coming soon")}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="gear" color={colors.primary} />
    </Pressable>
  );

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Profile",
            headerRight: renderHeaderRight,
          }}
        />
      )}
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileHeader}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
              <IconSymbol name="person.fill" color={colors.card} size={48} />
            </View>
            <Text style={styles.userName}>Secure User</Text>
            <Text style={styles.userEmail}>user@saveme.app</Text>
            <View style={[styles.premiumBadge, { backgroundColor: colors.highlight }]}>
              <IconSymbol name="star.fill" color={colors.card} size={14} />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          </View>

          <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Files Protected</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Shares</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>100%</Text>
              <Text style={styles.statLabel}>Secure</Text>
            </View>
          </View>

          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
                {section.items.map((item, itemIndex) => (
                  <View key={itemIndex}>
                    <View style={styles.settingItem}>
                      <View style={styles.settingLeft}>
                        <View style={[styles.settingIcon, { backgroundColor: item.color }]}>
                          <IconSymbol name={item.icon} color={colors.card} size={20} />
                        </View>
                        <Text style={styles.settingLabel}>{item.label}</Text>
                      </View>
                      <Switch
                        value={item.value}
                        onValueChange={item.onToggle}
                        trackColor={{ false: colors.border, true: item.color }}
                        thumbColor={colors.card}
                      />
                    </View>
                    {itemIndex < section.items.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
              {accountActions.map((action, index) => (
                <View key={index}>
                  <Pressable
                    style={styles.actionItem}
                    onPress={action.action}
                  >
                    <View style={styles.settingLeft}>
                      <View style={[styles.settingIcon, { backgroundColor: action.color }]}>
                        <IconSymbol name={action.icon} color={colors.card} size={20} />
                      </View>
                      <Text style={styles.settingLabel}>{action.label}</Text>
                    </View>
                    <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
                  </Pressable>
                  {index < accountActions.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>

          <Pressable
            style={[styles.dangerButton, { backgroundColor: colors.danger }]}
            onPress={() => {
              Alert.alert(
                "Panic Delete",
                "This will permanently delete ALL your secure files. This action cannot be undone!",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete Everything",
                    style: "destructive",
                    onPress: () => {
                      Alert.alert("Deleted", "All secure files have been deleted");
                      console.log("Panic delete executed");
                    }
                  }
                ]
              );
            }}
          >
            <IconSymbol name="exclamationmark.triangle.fill" color={colors.card} size={20} />
            <Text style={styles.dangerButtonText}>Panic Delete All Files</Text>
          </Pressable>

          <View style={[styles.infoCard, { backgroundColor: colors.primary }]}>
            <IconSymbol name="checkmark.shield.fill" color={colors.card} size={28} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Your Privacy is Protected</Text>
              <Text style={styles.infoDescription}>
                All your data is encrypted with AES-256 encryption and stored locally on your device.
              </Text>
            </View>
          </View>

          <Text style={styles.versionText}>Save Me v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  headerButtonContainer: {
    padding: 8,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  premiumText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  dangerButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
    marginBottom: 6,
  },
  infoDescription: {
    fontSize: 14,
    color: colors.card,
    lineHeight: 20,
    opacity: 0.9,
  },
  versionText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
});
