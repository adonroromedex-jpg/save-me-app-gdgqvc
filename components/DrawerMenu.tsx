
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const router = useRouter();
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const menuItems = [
    {
      title: 'Home',
      icon: 'house.fill',
      route: '/(tabs)/(home)/',
      color: colors.primary,
    },
    {
      title: 'Secure Drive',
      icon: 'lock.shield.fill',
      route: '/(tabs)/(home)/secure-drive',
      color: colors.primary,
    },
    {
      title: 'Private Camera',
      icon: 'camera.fill',
      route: '/(tabs)/(home)/private-camera',
      color: colors.secondary,
    },
    {
      title: 'Secure Sharing',
      icon: 'square.and.arrow.up.fill',
      route: '/(tabs)/(home)/secure-sharing',
      color: colors.accent,
    },
    {
      title: 'Shared with Me',
      icon: 'tray.fill',
      route: '/(tabs)/(home)/shared-with-me',
      color: colors.highlight,
    },
    {
      title: 'Access Log',
      icon: 'doc.text.fill',
      route: '/(tabs)/(home)/access-log',
      color: colors.warning,
    },
    {
      title: 'Manage Users',
      icon: 'person.2.fill',
      route: '/(tabs)/(home)/manage-users',
      color: colors.success,
    },
    {
      title: 'Gallery',
      icon: 'photo.fill',
      route: '/(tabs)/(gallery)/',
      color: colors.secondary,
    },
    {
      title: 'Settings',
      icon: 'gear',
      route: '/(tabs)/(settings)/',
      color: colors.textSecondary,
    },
    {
      title: 'Profile',
      icon: 'person.fill',
      route: '/(tabs)/profile',
      color: colors.primary,
    },
  ];

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
        </Pressable>

        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
              backgroundColor: colors.background,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
              <IconSymbol name="shield.fill" size={32} color="#ffffff" />
            </View>
            <Text style={styles.appName}>Save Me</Text>
            <Text style={styles.appTagline}>Your Privacy, Protected</Text>
          </View>

          <ScrollView
            style={styles.menuContainer}
            showsVerticalScrollIndicator={false}
          >
            {menuItems.map((item, index) => (
              <Pressable
                key={index}
                style={[styles.menuItem, { backgroundColor: colors.card }]}
                onPress={() => handleNavigate(item.route)}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                  <IconSymbol name={item.icon} size={20} color="#ffffff" />
                </View>
                <Text style={styles.menuText}>{item.title}</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
              </Pressable>
            ))}
          </ScrollView>

          <View style={[styles.footer, { backgroundColor: colors.card }]}>
            <IconSymbol name="checkmark.shield.fill" size={20} color={colors.success} />
            <Text style={styles.footerText}>AES-256 Encrypted</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    boxShadow: '4px 0px 12px rgba(0, 0, 0, 0.3)',
    elevation: 16,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  menuContainer: {
    flex: 1,
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 8,
  },
});
