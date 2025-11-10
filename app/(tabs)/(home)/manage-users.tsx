
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, Alert, Platform, TextInput } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors, commonStyles } from "@/styles/commonStyles";
import * as SecureStore from 'expo-secure-store';

interface AppUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  lastSeen?: number;
  registeredAt: number;
}

export default function ManageUsersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<AppUser[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load current user
      const userJson = await SecureStore.getItemAsync('current_user');
      if (userJson) {
        setCurrentUser(JSON.parse(userJson));
      }

      // Load registered users
      const usersJson = await SecureStore.getItemAsync('registered_users');
      if (usersJson) {
        setRegisteredUsers(JSON.parse(usersJson));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const updateCurrentUser = async () => {
    if (!currentUser) return;

    if (!newUsername.trim() && !newEmail.trim()) {
      Alert.alert('Error', 'Please enter a username or email to update');
      return;
    }

    try {
      const updatedUser: AppUser = {
        ...currentUser,
        username: newUsername.trim() || currentUser.username,
        email: newEmail.trim() || currentUser.email,
      };

      await SecureStore.setItemAsync('current_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setNewUsername('');
      setNewEmail('');

      Alert.alert('Success', 'Your profile has been updated');
      console.log('Updated user profile:', updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const addNewUser = async () => {
    if (!newUsername.trim() || !newEmail.trim()) {
      Alert.alert('Error', 'Please enter both username and email');
      return;
    }

    // Check if username already exists
    if (registeredUsers.some(u => u.username === newUsername.trim())) {
      Alert.alert('Error', 'Username already exists');
      return;
    }

    try {
      const newUser: AppUser = {
        id: Date.now().toString(),
        username: newUsername.trim(),
        email: newEmail.trim(),
        registeredAt: Date.now(),
        lastSeen: Date.now(),
      };

      const updatedUsers = [...registeredUsers, newUser];
      await SecureStore.setItemAsync('registered_users', JSON.stringify(updatedUsers));
      setRegisteredUsers(updatedUsers);
      setNewUsername('');
      setNewEmail('');

      Alert.alert('Success', `User ${newUser.username} has been added`);
      console.log('Added new user:', newUser);
    } catch (error) {
      console.error('Error adding user:', error);
      Alert.alert('Error', 'Failed to add user');
    }
  };

  const deleteUser = async (userId: string) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to remove this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedUsers = registeredUsers.filter(u => u.id !== userId);
              await SecureStore.setItemAsync('registered_users', JSON.stringify(updatedUsers));
              setRegisteredUsers(updatedUsers);
              console.log('Deleted user:', userId);
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const renderHeaderLeft = () => (
    <Pressable
      onPress={() => router.back()}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="chevron.left" color={colors.primary} />
    </Pressable>
  );

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Manage Users",
            headerLeft: renderHeaderLeft,
          }}
        />
      )}
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Current User Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Profile</Text>
            {currentUser && (
              <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
                <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.profileAvatarText}>
                    {currentUser.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileUsername}>{currentUser.username}</Text>
                  <Text style={styles.profileEmail}>{currentUser.email}</Text>
                  <Text style={styles.profileId}>ID: {currentUser.id}</Text>
                </View>
              </View>
            )}

            <View style={[styles.formCard, { backgroundColor: colors.card }]}>
              <Text style={styles.formTitle}>Update Profile</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                <IconSymbol name="person.fill" color={colors.textSecondary} size={20} />
                <TextInput
                  style={styles.input}
                  placeholder="New username"
                  placeholderTextColor={colors.textSecondary}
                  value={newUsername}
                  onChangeText={setNewUsername}
                  autoCapitalize="none"
                />
              </View>
              <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                <IconSymbol name="envelope.fill" color={colors.textSecondary} size={20} />
                <TextInput
                  style={styles.input}
                  placeholder="New email"
                  placeholderTextColor={colors.textSecondary}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <Pressable
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={updateCurrentUser}
              >
                <Text style={styles.buttonText}>Update Profile</Text>
              </Pressable>
            </View>
          </View>

          {/* Registered Users Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Registered Users ({registeredUsers.length})
            </Text>
            <Text style={styles.sectionDescription}>
              These users can receive shared content from you
            </Text>

            {registeredUsers.map((user) => (
              <View
                key={user.id}
                style={[styles.userCard, { backgroundColor: colors.card }]}
              >
                <View style={[styles.userAvatar, { backgroundColor: colors.secondary }]}>
                  <Text style={styles.userAvatarText}>
                    {user.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.username}>{user.username}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userId}>ID: {user.id}</Text>
                </View>
                <Pressable
                  style={[styles.deleteButton, { backgroundColor: colors.danger }]}
                  onPress={() => deleteUser(user.id)}
                >
                  <IconSymbol name="trash.fill" color={colors.card} size={16} />
                </Pressable>
              </View>
            ))}
          </View>

          {/* Add New User Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add New User</Text>
            <Text style={styles.sectionDescription}>
              Add other Save Me users to share content with
            </Text>

            <View style={[styles.formCard, { backgroundColor: colors.card }]}>
              <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                <IconSymbol name="person.fill" color={colors.textSecondary} size={20} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor={colors.textSecondary}
                  value={newUsername}
                  onChangeText={setNewUsername}
                  autoCapitalize="none"
                />
              </View>
              <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                <IconSymbol name="envelope.fill" color={colors.textSecondary} size={20} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <Pressable
                style={[styles.button, { backgroundColor: colors.accent }]}
                onPress={addNewUser}
              >
                <IconSymbol name="plus" color={colors.card} size={20} />
                <Text style={styles.buttonText}>Add User</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.primary }]}>
            <IconSymbol name="info.circle.fill" color={colors.card} size={24} />
            <Text style={styles.infoText}>
              In a production app, users would be registered through a backend server. This demo uses local storage for demonstration purposes.
            </Text>
          </View>
        </ScrollView>
      </View>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.card,
  },
  profileInfo: {
    flex: 1,
  },
  profileUsername: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  profileId: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  formCard: {
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
    marginLeft: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.card,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userId: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.card,
    marginLeft: 12,
    lineHeight: 20,
  },
});
