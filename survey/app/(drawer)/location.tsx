import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import { 
  MapPin, Map, Copy, Share2, Compass, Navigation, RotateCw, Globe, Gauge, Info 
} from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import MapView, { Marker } from 'react-native-maps';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import * as Haptics from 'expo-haptics';

export default function LocationScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<Location.LocationGeocodedAddress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid' | 'windy'>('standard');

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);

      let geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
      
      if (geocode.length > 0) {
        setAddress(geocode[0]);
      }
    } catch (error) {
      setErrorMsg('Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (location) {
      const textToCopy = `Lat: ${location.coords.latitude.toFixed(6)}, Lng: ${location.coords.longitude.toFixed(6)}`;
      await Clipboard.setStringAsync(textToCopy);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Location copied to clipboard! 📋");
    }
  };

  const shareLocation = async () => {
    if (location) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        await Share.share({
          message: `My current location: https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`,
        });
      } catch (error) {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    }
  };

  const openInMaps = () => {
    if (location) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const { latitude, longitude } = location.coords;
      const url = Platform.select({
        ios: `maps:0,0?q=${latitude},${longitude}`,
        android: `geo:0,0?q=${latitude},${longitude}`
      });
      if (url) Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={['top']}>
      <AppHeader title="Location Services" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text, fontFamily: Typography.fontFamily.medium }]}>Determining your exact coordinates...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.centerBox}>
            <Info size={48} color={theme.danger} />
            <Text style={[styles.errorText, { color: theme.text, fontFamily: Typography.fontFamily.medium }]}>{errorMsg}</Text>
            <AppButton title="Try Again" onPress={getLocation} style={{ width: 160 }} />
          </View>
        ) : location ? (
          <View style={styles.contentContainer}>
            {/* Coordinates Card */}
            <AppCard variant="elevated" style={[styles.card, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '18', borderWidth: 1 }]}>
              <View style={styles.cardHeader}>
                <MapPin size={20} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.primary, fontFamily: Typography.fontFamily.bold }]}>Current Coordinates</Text>
              </View>
              
              <View style={styles.coordRow}>
                <View style={styles.coordBox}>
                  <Text style={[styles.coordLabel, { color: theme.textSecondary, fontFamily: Typography.fontFamily.bold }]}>LATITUDE</Text>
                  <Text style={[styles.coordValue, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>{location.coords.latitude.toFixed(6)}°</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <View style={styles.coordBox}>
                  <Text style={[styles.coordLabel, { color: theme.textSecondary, fontFamily: Typography.fontFamily.bold }]}>LONGITUDE</Text>
                  <Text style={[styles.coordValue, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>{location.coords.longitude.toFixed(6)}°</Text>
                </View>
              </View>
            </AppCard>

            {/* Map view container */}
            <AppCard variant="elevated" style={[styles.card, { padding: 0, overflow: 'hidden', height: 280 }]}>
              <View style={styles.mapControls}>
                {['standard', 'satellite', 'hybrid', 'windy'].map((type) => (
                  <TouchableOpacity 
                    key={type} 
                    style={[styles.mapTypeBtn, mapType === type && { backgroundColor: theme.primary }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setMapType(type as any);
                    }}
                  >
                    <Text style={[styles.mapTypeBtnText, { fontFamily: Typography.fontFamily.bold }, mapType === type ? { color: '#FFF' } : { color: theme.textSecondary }]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {mapType === 'windy' ? (
                <WebView
                  source={{ uri: `https://embed.windy.com/embed2.html?lat=${location.coords.latitude}&lon=${location.coords.longitude}&zoom=11&level=surface&overlay=wind` }}
                  style={{ flex: 1 }}
                />
              ) : (
                <MapView 
                  style={{ flex: 1 }}
                  mapType={mapType as 'standard' | 'satellite' | 'hybrid'}
                  initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                >
                  <Marker 
                    coordinate={{
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }}
                    title="Current Site Position"
                  />
                </MapView>
              )}
            </AppCard>

            {/* Extra details card */}
            <AppCard variant="elevated" style={styles.card}>
              <View style={styles.detailRow}>
                <Globe size={18} color={theme.success} />
                <Text style={[styles.detailLabel, { color: theme.text, fontFamily: Typography.fontFamily.semiBold }]}>Accuracy:</Text>
                <Text style={[styles.detailValue, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>~{location.coords.accuracy?.toFixed(1)} meters</Text>
              </View>
              <View style={[styles.cardDivider, { backgroundColor: theme.borderLight }]} />
              <View style={styles.detailRow}>
                <Compass size={18} color={theme.primary} />
                <Text style={[styles.detailLabel, { color: theme.text, fontFamily: Typography.fontFamily.semiBold }]}>Altitude:</Text>
                <Text style={[styles.detailValue, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>{location.coords.altitude ? `${location.coords.altitude.toFixed(1)}m` : 'N/A'}</Text>
              </View>
              <View style={[styles.cardDivider, { backgroundColor: theme.borderLight }]} />
              <View style={styles.detailRow}>
                <Gauge size={18} color={theme.accent} />
                <Text style={[styles.detailLabel, { color: theme.text, fontFamily: Typography.fontFamily.semiBold }]}>Speed:</Text>
                <Text style={[styles.detailValue, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>{location.coords.speed ? `${(location.coords.speed * 3.6).toFixed(1)} km/h` : 'Stationary'}</Text>
              </View>
            </AppCard>

            {/* Geocode Address */}
            {address && (
              <AppCard variant="elevated" style={styles.card}>
                <View style={styles.cardHeader}>
                  <Map size={18} color={theme.text} />
                  <Text style={[styles.cardTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold, fontSize: 15 }]}>Approximate Address</Text>
                </View>
                <Text style={[styles.addressText, { color: theme.text, fontFamily: Typography.fontFamily.medium }]}>
                  {address.street ? `${address.street}, ` : ''}{address.city ? `${address.city}, ` : ''}{address.region ? `${address.region} ` : ''}{address.postalCode}
                </Text>
                <Text style={[styles.addressSubText, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium, marginTop: Spacing.xs }]}>{address.country}</Text>
              </AppCard>
            )}

            {/* Action grids */}
            <View style={styles.actionGrid}>
              <AppButton 
                title="Refresh" 
                variant="primary" 
                onPress={getLocation} 
                style={styles.actionBtn} 
                icon={<RotateCw size={16} color="#fff" />}
              />
              <AppButton 
                title="Copy" 
                variant="outline" 
                onPress={copyToClipboard} 
                style={styles.actionBtn} 
                icon={<Copy size={16} color={theme.primary} />}
              />
            </View>

            <View style={styles.actionGrid}>
              <AppButton 
                title="Open Maps" 
                variant="secondary" 
                onPress={openInMaps} 
                style={styles.actionBtn} 
                icon={<Navigation size={16} color={theme.text} />}
              />
              <AppButton 
                title="Share" 
                variant="outline" 
                onPress={shareLocation} 
                style={styles.actionBtn} 
                icon={<Share2 size={16} color={theme.primary} />}
              />
            </View>
            
            <View style={{ height: 100 }} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.lg, flexGrow: 1 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300, gap: Spacing.md },
  loadingText: { fontSize: Typography.fontSize.md },
  errorText: { fontSize: Typography.fontSize.md, textAlign: 'center' },
  contentContainer: { gap: Spacing.md },
  card: { borderWidth: 0, padding: Spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
  cardTitle: { fontSize: Typography.fontSize.md },
  
  coordRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  coordBox: { flex: 1, alignItems: 'center' },
  coordLabel: { fontSize: 10, marginBottom: Spacing.xs, letterSpacing: 0.5 },
  coordValue: { fontSize: Typography.fontSize.xl },
  divider: { width: 1.5, height: 40 },

  // Map type controls
  mapControls: { 
    position: 'absolute', top: Spacing.md, left: Spacing.md, right: Spacing.md, 
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)', 
    borderRadius: Radius.sm, padding: 4, gap: 4, zIndex: 10 
  },
  mapTypeBtn: { flex: 1, paddingVertical: Spacing.xs, borderRadius: Radius.xs - 2, alignItems: 'center' },
  mapTypeBtnText: { fontSize: 10 },

  // Detail item
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  detailLabel: { fontSize: Typography.fontSize.sm, width: 80 },
  detailValue: { fontSize: Typography.fontSize.sm },
  cardDivider: { height: 1, marginVertical: Spacing.xs },

  // Geocode
  addressText: { fontSize: Typography.fontSize.md, lineHeight: 22 },
  addressSubText: { fontSize: Typography.fontSize.sm },

  // Buttons grid
  actionGrid: { flexDirection: 'row', gap: Spacing.md },
  actionBtn: { flex: 1 },
});
