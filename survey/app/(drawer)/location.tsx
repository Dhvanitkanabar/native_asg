import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { Colors } from '@/constants/theme';
import MapView, { Marker } from 'react-native-maps';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
      // 1. Request Permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      // 2. Fetch Location
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);

      // 3. Extra Feature: Reverse Geocoding
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
      Alert.alert("Success", "Location copied to clipboard! 📋");
    }
  };

  const shareLocation = async () => {
    if (location) {
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
      const { latitude, longitude } = location.coords;
      const url = Platform.select({
        ios: `maps:0,0?q=${latitude},${longitude}`,
        android: `geo:0,0?q=${latitude},${longitude}`
      });
      if (url) Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Location Services</Text>
        <Text style={[styles.headerSubtitle, { color: theme.icon }]}>Module 4 Implementation</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={[styles.loadingText, { color: theme.text }]}>Determining your exact location...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.centerBox}>
            <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
            <Text style={[styles.errorText, { color: theme.text }]}>{errorMsg}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={getLocation}>
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : location ? (
          <View style={styles.contentContainer}>
            {/* Main Coordinates Card */}
            <View style={[styles.card, { backgroundColor: theme.tint + '10' }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="location-sharp" size={24} color={theme.tint} />
                <Text style={[styles.cardTitle, { color: theme.tint }]}>Current Coordinates</Text>
              </View>
              
              <View style={styles.coordRow}>
                <View style={styles.coordBox}>
                  <Text style={[styles.coordLabel, { color: theme.icon }]}>LATITUDE</Text>
                  <Text style={[styles.coordValue, { color: theme.text }]}>{location.coords.latitude.toFixed(5)}°</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.coordBox}>
                  <Text style={[styles.coordLabel, { color: theme.icon }]}>LONGITUDE</Text>
                  <Text style={[styles.coordValue, { color: theme.text }]}>{location.coords.longitude.toFixed(5)}°</Text>
                </View>
              </View>
            </View>

            {/* Live Map */}
            <View style={[styles.card, { padding: 0, overflow: 'hidden', height: 260, backgroundColor: theme.background }]}>
              {/* Map Type Controls */}
              <View style={styles.mapControls}>
                {['standard', 'satellite', 'hybrid', 'windy'].map((type) => (
                  <TouchableOpacity 
                    key={type} 
                    style={[styles.mapTypeBtn, mapType === type && { backgroundColor: theme.tint }]}
                    onPress={() => setMapType(type as any)}
                  >
                    <Text style={[styles.mapTypeBtnText, mapType === type && { color: '#FFF' }]}>
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
                  title="You are here"
                />
              </MapView>
              )}
            </View>

            {/* Extra Data Card */}
            <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.icon + '30', borderWidth: 1 }]}>
               <View style={styles.detailRow}>
                  <MaterialIcons name="my-location" size={20} color="#4CAF50" />
                  <Text style={[styles.detailLabel, { color: theme.text }]}>Accuracy:</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>~{location.coords.accuracy?.toFixed(1)} meters</Text>
               </View>
               <View style={styles.detailRow}>
                  <MaterialIcons name="terrain" size={20} color="#FF9800" />
                  <Text style={[styles.detailLabel, { color: theme.text }]}>Altitude:</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{location.coords.altitude ? `${location.coords.altitude.toFixed(1)}m` : 'N/A'}</Text>
               </View>
               <View style={styles.detailRow}>
                  <MaterialIcons name="speed" size={20} color="#2196F3" />
                  <Text style={[styles.detailLabel, { color: theme.text }]}>Speed:</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{location.coords.speed ? `${(location.coords.speed * 3.6).toFixed(1)} km/h` : 'Stationary'}</Text>
               </View>
            </View>

            {/* Address Card (Extra Feature) */}
            {address && (
              <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.icon + '30', borderWidth: 1 }]}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="map" size={20} color={theme.text} />
                  <Text style={[styles.cardTitle, { color: theme.text, fontSize: 16 }]}>Approximate Address</Text>
                </View>
                <Text style={[styles.addressText, { color: theme.text }]}>
                  {address.street ? `${address.street}, ` : ''}{address.city ? `${address.city}, ` : ''}{address.region ? `${address.region} ` : ''}{address.postalCode}
                </Text>
                <Text style={[styles.addressSubText, { color: theme.icon }]}>{address.country}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionGrid}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.tint }]} onPress={getLocation}>
                <Ionicons name="refresh" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>Refresh</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4CAF50' }]} onPress={copyToClipboard}>
                <Ionicons name="copy-outline" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionGrid}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FF9800' }]} onPress={openInMaps}>
                <MaterialIcons name="directions" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>Open in Maps</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#9C27B0' }]} onPress={shareLocation}>
                <Ionicons name="share-outline" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
            
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  contentContainer: {
    gap: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordBox: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 16,
  },
  coordLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  coordValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  addressSubText: {
    fontSize: 14,
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mapControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  mapTypeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  mapTypeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  }
});
