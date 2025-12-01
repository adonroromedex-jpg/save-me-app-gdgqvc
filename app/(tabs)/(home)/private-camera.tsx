
import React, { useState, useRef, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { View, Text, StyleSheet, Pressable, Alert, Platform } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import * as SecureStore from 'expo-secure-store';

interface SecureFile {
  id: string;
  uri: string;
  type: 'image' | 'video';
  timestamp: number;
  encrypted: boolean;
}

export default function PrivateCameraScreen() {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <>
        {Platform.OS === 'ios' && (
          <Stack.Screen
            options={{
              title: "Private Camera",
              headerShown: false,
            }}
          />
        )}
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.permissionContainer}>
            <IconSymbol name="camera.fill" color={colors.textSecondary} size={64} />
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionMessage}>
              Save Me needs access to your camera to take private photos and videos that are stored securely.
            </Text>
            <Pressable
              style={[styles.permissionButton, { backgroundColor: colors.primary }]}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </Pressable>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={[styles.backButtonText, { color: colors.primary }]}>Go Back</Text>
            </Pressable>
          </View>
        </View>
      </>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
        });

        if (photo) {
          // Save to secure storage
          const storedFiles = await SecureStore.getItemAsync('secure_files');
          const files: SecureFile[] = storedFiles ? JSON.parse(storedFiles) : [];
          
          const newFile: SecureFile = {
            id: Date.now().toString(),
            uri: photo.uri,
            type: 'image',
            timestamp: Date.now(),
            encrypted: true,
          };

          files.push(newFile);
          await SecureStore.setItemAsync('secure_files', JSON.stringify(files));
          
          Alert.alert('Success', 'Photo saved to secure drive', [
            { text: 'Take Another', style: 'default' },
            { text: 'View Drive', onPress: () => router.push('/(tabs)/(home)/secure-drive') }
          ]);
          
          console.log('Photo saved to secure drive:', newFile.id);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync();
        
        if (video) {
          // Save to secure storage
          const storedFiles = await SecureStore.getItemAsync('secure_files');
          const files: SecureFile[] = storedFiles ? JSON.parse(storedFiles) : [];
          
          const newFile: SecureFile = {
            id: Date.now().toString(),
            uri: video.uri,
            type: 'video',
            timestamp: Date.now(),
            encrypted: true,
          };

          files.push(newFile);
          await SecureStore.setItemAsync('secure_files', JSON.stringify(files));
          
          Alert.alert('Success', 'Video saved to secure drive');
          console.log('Video saved to secure drive:', newFile.id);
        }
      } catch (error) {
        console.error('Error recording video:', error);
        Alert.alert('Error', 'Failed to record video');
      } finally {
        setIsRecording(false);
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const renderHeaderLeft = () => (
    <Pressable
      onPress={() => router.back()}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="xmark" color={colors.card} />
    </Pressable>
  );

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Private Camera",
            headerShown: false,
          }}
        />
      )}
      <View style={styles.container}>
        <CameraView 
          style={styles.camera} 
          facing={facing}
          ref={cameraRef}
        >
          <View style={styles.topBar}>
            <Pressable
              style={styles.topButton}
              onPress={() => router.back()}
            >
              <IconSymbol name="xmark" color={colors.card} size={24} />
            </Pressable>
            <View style={[styles.encryptedBadge, { backgroundColor: colors.success }]}>
              <IconSymbol name="lock.fill" color={colors.card} size={14} />
              <Text style={styles.encryptedText}>Encrypted</Text>
            </View>
            <Pressable
              style={styles.topButton}
              onPress={toggleCameraFacing}
            >
              <IconSymbol name="arrow.triangle.2.circlepath.camera.fill" color={colors.card} size={24} />
            </Pressable>
          </View>

          <View style={styles.bottomBar}>
            <View style={styles.controlsContainer}>
              <Pressable
                style={styles.galleryButton}
                onPress={() => router.push('/(tabs)/(home)/secure-drive')}
              >
                <IconSymbol name="photo.fill.on.rectangle.fill" color={colors.card} size={28} />
              </Pressable>

              <Pressable
                style={[styles.captureButton, isRecording && styles.captureButtonRecording]}
                onPress={takePicture}
                onLongPress={startRecording}
                onPressOut={stopRecording}
              >
                <View style={[styles.captureButtonInner, isRecording && styles.captureButtonInnerRecording]} />
              </Pressable>

              <Pressable
                style={styles.videoButton}
                onPress={() => Alert.alert('Video Mode', 'Long press the capture button to record video')}
              >
                <IconSymbol name="video.fill" color={colors.card} size={28} />
              </Pressable>
            </View>

            <Text style={styles.instructionText}>
              {isRecording ? 'Recording... Release to stop' : 'Tap for photo • Long press for video'}
            </Text>
          </View>
        </CameraView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: colors.text,
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerButtonContainer: {
    padding: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  encryptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  encryptedText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  galleryButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonRecording: {
    borderColor: colors.danger,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.card,
  },
  captureButtonInnerRecording: {
    borderRadius: 8,
    backgroundColor: colors.danger,
  },
  videoButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    color: colors.card,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
});
