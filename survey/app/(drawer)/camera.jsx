import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Dimensions, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Zap, RotateCw, Grid, Check, X, Trash2, Save, MapPin, Compass, Clock, Sliders, Camera 
} from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppButton } from '@/components/ui/AppButton';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Camera Settings
  const [facing, setFacing] = useState("back");
  const [flash, setFlash] = useState("off");
  const [zoom, setZoom] = useState(0);
  const [baseZoom, setBaseZoom] = useState(0);

  // States for features
  const [showGrid, setShowGrid] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [tilt, setTilt] = useState(0);
  const [photo, setPhoto] = useState(null);
  const [captureDetails, setCaptureDetails] = useState(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  
  // Animations
  const scale = useRef(new Animated.Value(1)).current;
  const focusOpacity = useRef(new Animated.Value(0)).current;
  const [focus, setFocus] = useState({ x: 0, y: 0 });

  // Initialize sensors and location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setLocationData(location);
      }
    })();

    Accelerometer.setUpdateInterval(100);
    const subscription = Accelerometer.addListener(accelerometerData => {
      const angle = Math.atan2(accelerometerData.y, accelerometerData.x) * (180 / Math.PI);
      let tiltValue = angle + 90;
      if (tiltValue > 90) tiltValue -= 180;
      setTilt(tiltValue);
    });

    return () => {
      subscription && subscription.remove();
    };
  }, []);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      let value = baseZoom + (e.scale - 1) * 0.4;
      if (value < 0) value = 0;
      if (value > 1) value = 1;
      setZoom(value);
    })
    .onEnd(() => {
      setBaseZoom(zoom);
    });

  const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd(() => {
    setFacing(prev => prev === "back" ? "front" : "back");
  });

  const combinedGestures = Gesture.Simultaneous(pinch, doubleTap);

  const saveToGallery = async (uri) => {
    try {
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      if (!mediaPermission.granted) return;
      
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("Smart Survey App", asset, false);
    } catch (error) {
      console.log(error);
    }
  };

  const capturePhoto = async () => {
    if (isTakingPhoto) return;
    try {
      setIsTakingPhoto(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.sequence([
        Animated.timing(scale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true })
      ]).start();

      if (cameraRef.current) {
        const options = { quality: 0.8, base64: true, exif: true };
        const result = await cameraRef.current.takePictureAsync(options);
        setPhoto(result.uri);
        
        setCaptureDetails({
          time: new Date().toLocaleString(),
          location: locationData ? `${locationData.coords.latitude.toFixed(5)}, ${locationData.coords.longitude.toFixed(5)}` : 'Location unavailable',
          tilt: tilt.toFixed(1)
        });
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => setPhoto(null) }
      ]
    );
  };

  const handleSave = async () => {
    if (photo) {
      await saveToGallery(photo);
      
      // Save to history app storage
      try {
        const STORAGE_KEY = '@gallery_photos_v1';
        const fileName = photo.split('/').pop() || `photo-${Date.now()}.jpg`;
        const newUri = (FileSystem.documentDirectory || '') + fileName;
        
        await FileSystem.copyAsync({
          from: photo,
          to: newUri
        });

        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        let historyPhotos = [];
        if (stored) {
          historyPhotos = JSON.parse(stored);
        }

        const pseudoRandom = Math.abs(Math.sin(Date.now())) * 200; 
        const heightVal = 150 + pseudoRandom;

        const newPhotoObj = {
          id: `local-${Date.now()}`,
          uri: newUri,
          height: heightVal,
          isFavorite: false,
          isHidden: false,
        };

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([newPhotoObj, ...historyPhotos]));
      } catch (e) {
        console.log("Error saving to history gallery", e);
      }

      Alert.alert("Success", "Photo saved to gallery with metadata!");
      setPhoto(null);
    }
  };

  const focusCamera = (e) => {
    const x = e.nativeEvent.locationX;
    const y = e.nativeEvent.locationY;
    setFocus({ x, y });
    
    focusOpacity.setValue(1);
    Animated.timing(focusOpacity, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
      delay: 500
    }).start();
  };

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: '#000' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: '#000' }]}>
        <Camera size={64} color="#fff" style={{ marginBottom: Spacing.xl }} />
        <Text style={[styles.permissionText, { fontFamily: Typography.fontFamily.medium }]}>We need your permission to show the camera</Text>
        <AppButton title="Grant Permission" onPress={requestPermission} style={styles.permissionButton} />
      </SafeAreaView>
    );
  }

  // --- PREVIEW SCREEN ---
  if (photo) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.previewImage} />
          
          <View style={styles.metadataOverlay}>
            <View style={styles.metaBadge}>
              <Clock size={14} color="#fff" style={styles.metaIcon} />
              <Text style={styles.timeText}>{captureDetails?.time}</Text>
            </View>
            <View style={styles.metaBadge}>
              <MapPin size={14} color="#fff" style={styles.metaIcon} />
              <Text style={styles.timeText}>{captureDetails?.location}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Compass size={14} color="#fff" style={styles.metaIcon} />
              <Text style={styles.timeText}>Tilt: {captureDetails?.tilt}°</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setPhoto(null)}>
            <RotateCw size={24} color="#fff" />
            <Text style={[styles.actionText, { fontFamily: Typography.fontFamily.bold }]}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSave}>
            <Save size={20} color="#fff" />
            <Text style={[styles.saveButtonText, { fontFamily: Typography.fontFamily.bold }]}>Save Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Trash2 size={24} color={theme.danger} />
            <Text style={[styles.actionText, { color: theme.danger, fontFamily: Typography.fontFamily.bold }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- CAMERA SCREEN ---
  const isLevel = Math.abs(tilt) < 3;

  return (
    <View style={styles.container}>
      <GestureDetector gesture={combinedGestures}>
        <TouchableOpacity activeOpacity={1} style={styles.camera} onPress={focusCamera}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            flash={flash}
            zoom={zoom}
          />
          
          {/* Rule of Thirds Grid Overlay */}
          {showGrid && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={[styles.gridLine, styles.gridH1]} />
              <View style={[styles.gridLine, styles.gridH2]} />
              <View style={[styles.gridLine, styles.gridV1]} />
              <View style={[styles.gridLine, styles.gridV2]} />
            </View>
          )}

          {/* Focus Ring */}
          <Animated.View 
            style={[
              styles.focusRing, 
              { left: focus.x - 30, top: focus.y - 30, opacity: focusOpacity }
            ]} 
            pointerEvents="none"
          />

          {/* Top Controls Bar */}
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.glassButton} onPress={() => setFlash(flash === "off" ? "on" : "off")}>
              <Zap size={20} color={flash === 'on' ? '#FFD700' : '#fff'} />
            </TouchableOpacity>
            
            <View style={styles.centerPill}>
              {locationData ? (
                <View style={styles.pillContent}>
                  <MapPin size={12} color={theme.success} />
                  <Text style={[styles.pillText, { fontFamily: Typography.fontFamily.bold }]}>GPS Ready</Text>
                </View>
              ) : (
                <ActivityIndicator size="small" color="#fff" />
              )}
            </View>

            <TouchableOpacity style={[styles.glassButton, showGrid && styles.glassButtonActive]} onPress={() => setShowGrid(!showGrid)}>
              <Grid size={20} color={showGrid ? theme.success : '#fff'} />
            </TouchableOpacity>
          </View>

          {/* Level Indicator */}
          <View style={styles.levelContainer}>
             <View style={styles.levelBase}>
                <Animated.View style={[
                  styles.levelLine, 
                  isLevel ? { backgroundColor: theme.success } : { backgroundColor: '#fff' },
                  { transform: [{ rotateZ: `${-tilt}deg` }] }
                ]} />
             </View>
          </View>

          {/* Zoom Slider */}
          <View style={styles.zoomContainer}>
            <Sliders size={16} color="#fff" />
            <Slider
              minimumValue={0}
              maximumValue={1}
              value={zoom}
              onValueChange={setZoom}
              style={{ width: width - 120, height: 40 }}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor="#fff"
            />
          </View>

          {/* Bottom Controls Bar */}
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.sideButton} onPress={() => router.push('/(drawer)/(tabs)/history')}>
              <ImageIcon size={24} color="#fff" />
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale }] }}>
              <TouchableOpacity style={styles.capture} onPress={capturePhoto} disabled={isTakingPhoto}>
                {isTakingPhoto ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <View style={[styles.captureInner, isLevel && { borderColor: theme.success, borderWidth: 3 }]} />
                )}
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity style={styles.sideButton} onPress={() => setFacing(facing === "back" ? "front" : "back")}>
              <RotateCw size={24} color="#fff" />
            </TouchableOpacity>
          </View>

        </TouchableOpacity>
      </GestureDetector>
    </View>
  );
}

// Reuse image style helper
const ImageIcon = ({ size, color }) => {
  return (
    <View style={{ width: size, height: size, borderRadius: Radius.xs, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
      <Sliders size={size * 0.7} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: 'black' },
  permissionText: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: 'white' },
  permissionButton: { width: 200, height: 50 },
  
  // --- Grid ---
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.3)' },
  gridH1: { top: '33.33%', left: 0, right: 0, height: 1 },
  gridH2: { top: '66.66%', left: 0, right: 0, height: 1 },
  gridV1: { left: '33.33%', top: 0, bottom: 0, width: 1 },
  gridV2: { left: '66.66%', top: 0, bottom: 0, width: 1 },

  // --- Focus ---
  focusRing: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.1)' },

  // --- UI Controls ---
  topControls: { position: "absolute", top: Platform.OS === 'ios' ? 60 : 40, width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: 'center', paddingHorizontal: 20 },
  glassButton: { backgroundColor: "rgba(0,0,0,0.4)", width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  glassButtonActive: { backgroundColor: "rgba(16, 185, 129, 0.2)", borderWidth: 1, borderColor: '#10B981' },
  
  centerPill: { backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  pillContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pillText: { color: '#fff', fontSize: 12 },

  levelContainer: { position: 'absolute', top: height / 2 - 20, width: '100%', alignItems: 'center', opacity: 0.7 },
  levelBase: { width: 150, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  levelLine: { width: 100, height: 2, backgroundColor: '#fff' },

  zoomContainer: { position: "absolute", bottom: 150, width: "100%", flexDirection: 'row', alignItems: "center", justifyContent: 'center', paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 10, gap: Spacing.sm },
  
  bottomControls: { position: "absolute", bottom: 40, width: "100%", flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  sideButton: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 25 },
  
  capture: { width: 84, height: 84, borderRadius: 42, backgroundColor: "rgba(255,255,255,0.3)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: '#fff' },
  captureInner: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#fff" },

  // --- Preview ---
  previewContainer: { flex: 1, position: 'relative' },
  previewImage: { flex: 1, resizeMode: 'contain' },
  metadataOverlay: { position: 'absolute', top: 20, left: 20, right: 20, gap: 10 },
  metaBadge: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  metaIcon: { marginRight: 6 },
  timeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  
  previewActions: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 30, backgroundColor: '#000' },
  actionButton: { alignItems: 'center', padding: 10 },
  saveButton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveButtonText: { color: '#fff', fontSize: 16 },
  actionText: { color: '#fff', fontSize: 14, marginTop: 4 }
});
