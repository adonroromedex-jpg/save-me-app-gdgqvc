
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    title: 'Secure Phone Authentication',
    description: 'Verify your phone number to access the app and connect with other verified users securely.',
    icon: 'phone.fill',
    color: colors.primary,
  },
  {
    title: 'End-to-End Encryption',
    description: 'All your photos and videos are encrypted locally with AES-256 before sharing. Only you control access.',
    icon: 'lock.shield.fill',
    color: colors.secondary,
  },
  {
    title: 'Screenshot Protection',
    description: 'Advanced security blocks screenshots and screen recordings. All access attempts are logged.',
    icon: 'eye.slash.fill',
    color: colors.danger,
  },
  {
    title: 'Auto-Delete After 24h',
    description: 'Shared content automatically self-destructs after 24 hours. No traces left behind.',
    icon: 'timer',
    color: colors.warning,
  },
  {
    title: 'Passcode on Every Open',
    description: 'App requires authentication every time you open it. No session caching for maximum security.',
    icon: 'key.fill',
    color: colors.success,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      opacity.value = withTiming(0, { duration: 200 }, () => {
        translateX.value = withSpring(0);
        opacity.value = withTiming(1, { duration: 200 });
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/(auth)/phone-verification');
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/phone-verification');
  };

  const currentSlide = onboardingData[currentIndex];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <Text style={styles.appName}>Save Me</Text>
        {currentIndex < onboardingData.length - 1 && (
          <Pressable onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      <Animated.View style={[styles.content, animatedStyle]}>
        <View style={[styles.iconContainer, { backgroundColor: currentSlide.color }]}>
          <IconSymbol name={currentSlide.icon as any} size={80} color="#ffffff" />
        </View>

        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.description}>{currentSlide.description}</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
                { backgroundColor: index === currentIndex ? colors.primary : 'rgba(255, 255, 255, 0.3)' },
              ]}
            />
          ))}
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: currentSlide.color }]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <IconSymbol name="arrow.right" size={20} color="#ffffff" />
        </Pressable>

        <View style={styles.securityBadge}>
          <IconSymbol name="checkmark.shield.fill" size={20} color={colors.success} />
          <Text style={styles.securityText}>
            Military-grade AES-256 encryption
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  skipText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.3)',
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  securityText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginLeft: 8,
  },
});
