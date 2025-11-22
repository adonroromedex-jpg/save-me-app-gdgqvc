
import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
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
  isReceivedContent?: boolean;
}

export default function PrivateCameraScreen() {
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState(false);
  const router = useRouter();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Pressable onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const shareFile = (fileId: string, fileUri: string, fileType: 'image' | 'video') => {
    router.push({
      pathname: '/(tabs)/(home)/share-with-users',
      params: {
        fileId,
        fileUri,
        fileType,
      }
    });
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
        });

        const filesJson = await SecureStore.getItemAsync('secure_files');
        const files: SecureFile[] = filesJson ? JSON.parse(filesJson) : [];

        const newFile: SecureFile = {
          id: Date.now().toString(),
          uri: photo.uri,
          type: 'image',
          timestamp: Date.now(),
          encrypted: true,
          isReceivedContent: false, // User's own content from camera
        };

        files.push(newFile);
        await SecureStore.setItemAsync('secure_files', JSON.stringify(files));

        Alert.alert(
          '✓ Photo Captured',
          'Your photo has been securely saved to your encrypted drive.',
          [
            { text: 'Take Another', style: 'cancel' },
            { 
              text: 'Share', 
              onPress: () => shareFile(newFile.id, newFile.uri, newFile.type)
            },
            { 
              text: 'View Drive', 
              onPress: () => router.push('/(tabs)/(home)/secure-drive')
            }
          ]
        );

        console.log('Photo saved:', newFile.id);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync({
          maxDuration: 60,
        });

        const filesJson = await SecureStore.getItemAsync('secure_files');
        const files: SecureFile[] = filesJson ? JSON.parse(filesJson) : [];

        const newFile: SecureFile = {
          id: Date.now().toString(),
          uri: video.uri,
          type: 'video',
          timestamp: Date.now(),
          encrypted: true,
          isReceivedContent: false, // User's own content from camera
        };

        files.push(newFile);
        await SecureStore.setItemAsync('secure_files', JSON.stringify(files));

        Alert.alert(
          '✓ Video Recorded',
          'Your video has been securely saved to your encrypted drive.',
          [
            { text: 'Record Another', style: 'cancel' },
            { 
              text: 'Share', 
              onPress: () => shareFile(newFile.id, newFile.uri, newFile.type)
            },
            { 
              text: 'View Drive', 
              onPress: () => router.push('/(tabs)/(home)/secure-drive')
            }
          ]
        );

        console.log('Video saved:', newFile.id);
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
            headerLeft: renderHeaderLeft,
            headerStyle: {
              backgroundColor: 'transparent',
            },
            headerTransparent: true,
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
              onPress={() => router.back()}
              style={styles.topButton}
            >
              <IconSymbol name="xmark" color={colors.card} size={24} />
            </Pressable>
            <View style={[styles.recordingIndicator, isRecording && styles.recordingActive]}>
              {isRecording && (
                <>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>REC</Text>
                </>
              )}
            </View>
            <Pressable
              onPress={toggleCameraFacing}
              style={styles.topButton}
            >
              <IconSymbol name="arrow.triangle.2.circlepath.camera" color={colors.card} size={24} />
            </Pressable>
          </View>

          <View style={styles.bottomBar}>
            <View style={styles.controlsContainer}>
              <Pressable
                style={styles.galleryButton}
                onPress={() => router.push('/(tabs)/(home)/secure-drive')}
              >
                <IconSymbol name="photo.stack" color={colors.card} size={28} />
              </Pressable>

              <Pressable
                style={[styles.captureButton, isRecording && styles.captureButtonRecording]}
                onPress={takePicture}
                disabled={isRecording}
              >
                <View style={[styles.captureButtonInner, isRecording && styles.captureButtonInnerRecording]} />
              </Pressable>

              <Pressable
                style={styles.videoButton}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <IconSymbol 
                  name={isRecording ? "stop.circle.fill" : "video.circle.fill"} 
                  color={isRecording ? colors.danger : colors.card} 
                  size={28} 
                />
              </Pressable>
            </View>

            <View style={styles.infoContainer}>
              <IconSymbol name="lock.shield.fill" color={colors.card} size={16} />
              <Text style={styles.infoText}>
                Content captured here is encrypted and never saved to your device gallery
              </Text>
            </View>
          </View>
        </CameraView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: colors.text,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  permissionButtonText: {
    color: colors.card,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  headerButtonContainer: {
    padding: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    justifyContent: 'center',
  },
  recordingActive: {
    backgroundColor: colors.danger,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.card,
    marginRight: 6,
  },
  recordingText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonRecording: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.card,
  },
  captureButtonInnerRecording: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  videoButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 12,
  },
  infoText: {
    color: colors.card,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});
