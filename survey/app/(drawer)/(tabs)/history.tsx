import { Image } from 'expo-image';
import { StyleSheet, ScrollView, View, Text, Pressable, Modal, Alert, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image as RNImage } from 'react-native';

const STORAGE_KEY = '@gallery_photos_v1';
const HIDDEN_PASSWORD = '2106';

// Removed static images for this project since they don't exist here
const staticRequires = [];

export default function HistoryScreen() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fullScreenPhoto, setFullScreenPhoto] = useState<any | null>(null);

  // Hidden feature state
  const [isViewingHidden, setIsViewingHidden] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let loadedPhotos = [];
      if (stored) {
        loadedPhotos = JSON.parse(stored);
      } else {
        loadedPhotos = staticRequires.map((src, index) => {
          const pseudoRandom = Math.abs(Math.sin(index + 1)) * 200; 
          const height = 150 + pseudoRandom;
          return {
            id: `static-${index}`,
            staticIndex: index,
            height,
            isFavorite: false,
            isHidden: false,
          };
        });
      }
      
      // Cleanup for removed static images
      loadedPhotos = loadedPhotos.filter((p: any) => !p.uri ? p.staticIndex < staticRequires.length : true);

      setPhotos(loadedPhotos);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loadedPhotos));
    } catch (e) {
      console.log('Error loading photos', e);
    }
  };

  const savePhotos = async (newPhotos: any[]) => {
    setPhotos(newPhotos);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPhotos));
  };

  const addPhoto = async () => {
    if (isViewingHidden) {
      Alert.alert('Not allowed', 'Cannot add photos while viewing hidden gallery.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      try {
        const newPhotos = await Promise.all(result.assets.map(async (asset, index) => {
          const fileName = asset.uri.split('/').pop() || `photo-${Date.now()}-${index}.jpg`;
          const newUri = (FileSystem.documentDirectory || '') + fileName;
          
          await FileSystem.copyAsync({
            from: asset.uri,
            to: newUri
          });

          const pseudoRandom = Math.abs(Math.sin(Date.now() + index)) * 200; 
          const height = 150 + pseudoRandom;

          return {
            id: `local-${Date.now()}-${index}`,
            uri: newUri,
            height,
            isFavorite: false,
            isHidden: false,
          };
        }));

        await savePhotos([...newPhotos, ...photos]);
      } catch (e) {
        Alert.alert('Error', 'Failed to save one or more photos');
      }
    }
  };

  const deleteSelected = async () => {
    Alert.alert('Delete Photos', `Are you sure you want to delete ${selectedIds.size} photo(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          const remaining = photos.filter(p => !selectedIds.has(p.id));
          
          photos.forEach(async (p) => {
            if (selectedIds.has(p.id) && p.uri) {
              try {
                await FileSystem.deleteAsync(p.uri, { idempotent: true });
              } catch(e) {}
            }
          });

          await savePhotos(remaining);
          setSelectedIds(new Set());
          setIsSelectionMode(false);
      }}
    ]);
  };

  const toggleHideSelected = async () => {
    const updated = photos.map(p => {
      if (selectedIds.has(p.id)) {
        return { ...p, isHidden: !p.isHidden };
      }
      return p;
    });
    await savePhotos(updated);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handlePhotoPress = (photo: any) => {
    if (isSelectionMode) {
      toggleSelection(photo.id);
    } else {
      setFullScreenPhoto(photo);
    }
  };

  const toggleFavorite = async (photoId: string) => {
    const updated = photos.map(p => p.id === photoId ? { ...p, isFavorite: !p.isFavorite } : p);
    await savePhotos(updated);
    if (fullScreenPhoto && fullScreenPhoto.id === photoId) {
      setFullScreenPhoto({ ...fullScreenPhoto, isFavorite: !fullScreenPhoto.isFavorite });
    }
  };

  const toggleHidden = async (photoId: string) => {
    const updated = photos.map(p => p.id === photoId ? { ...p, isHidden: !p.isHidden } : p);
    await savePhotos(updated);
    setFullScreenPhoto(null);
  };

  const sharePhoto = async (photo: any) => {
    if (isViewingHidden) {
      Alert.alert('Privacy Restriction', 'Cannot share hidden photos.');
      return;
    }
    const fileUri = photo.uri || RNImage.resolveAssetSource(staticRequires[photo.staticIndex]).uri;
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (isAvailable) {
      try {
        await Sharing.shareAsync(fileUri);
      } catch (e) {
        Alert.alert('Error', 'Could not share this photo.');
      }
    }
  };

  const saveToGallery = async (photo: any) => {
    if (isViewingHidden) {
      Alert.alert('Privacy Restriction', 'Cannot save hidden photos to device gallery.');
      return;
    }
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save to your photos.');
        return;
      }
      const fileUri = photo.uri || RNImage.resolveAssetSource(staticRequires[photo.staticIndex]).uri;
      
      let localUri = fileUri;
      if (fileUri.startsWith('http')) {
        const download = await FileSystem.downloadAsync(fileUri, (FileSystem.cacheDirectory || '') + 'temp.jpg');
        localUri = download.uri;
      }

      await MediaLibrary.saveToLibraryAsync(localUri);
      Alert.alert('Success', 'Photo saved to your gallery!');
    } catch (e) {
      Alert.alert('Error', 'Failed to save photo.');
    }
  };

  const deleteSinglePhoto = (photoId: string) => {
    Alert.alert('Delete Photo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          const remaining = photos.filter(p => p.id !== photoId);
          
          const p = photos.find(x => x.id === photoId);
          if (p && p.uri) {
            try { await FileSystem.deleteAsync(p.uri, { idempotent: true }); } catch(e) {}
          }
          await savePhotos(remaining);
          setFullScreenPhoto(null);
      }}
    ]);
  };

  const getSource = (item: any) => item.uri ? { uri: item.uri } : staticRequires[item.staticIndex];

  const visiblePhotos = photos.filter(p => !!p.isHidden === isViewingHidden);
  const leftColumn = visiblePhotos.filter((_, i) => i % 2 === 0);
  const rightColumn = visiblePhotos.filter((_, i) => i % 2 !== 0);

  const handlePasswordSubmit = () => {
    if (passwordInput === HIDDEN_PASSWORD) {
      setShowPasswordPrompt(false);
      setPasswordInput('');
      setIsViewingHidden(true);
    } else {
      Alert.alert('Error', 'Incorrect password');
      setPasswordInput('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{isViewingHidden ? 'Hidden' : 'History'}</Text>
          <Text style={styles.headerSubtitle}>
            {visiblePhotos.length} photos {isSelectionMode ? `(${selectedIds.size} selected)` : ''}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {isSelectionMode ? (
            <>
              {selectedIds.size > 0 && (
                <TouchableOpacity style={styles.actionBtn} onPress={toggleHideSelected}>
                  <Ionicons name={isViewingHidden ? "eye" : "eye-off"} size={26} color="#007AFF" />
                </TouchableOpacity>
              )}
              {selectedIds.size > 0 && (
                <TouchableOpacity style={styles.actionBtn} onPress={deleteSelected}>
                  <Ionicons name="trash" size={24} color="#FF3B30" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionBtn} onPress={() => {
                setIsSelectionMode(false);
                setSelectedIds(new Set());
              }}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {!isViewingHidden && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => setShowPasswordPrompt(true)}>
                  <Ionicons name="eye-off-outline" size={26} color="#007AFF" />
                </TouchableOpacity>
              )}
              {isViewingHidden && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => setIsViewingHidden(false)}>
                  <Ionicons name="close-circle-outline" size={26} color="#FF3B30" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionBtn} onPress={() => setIsSelectionMode(true)}>
                <Ionicons name="checkmark-circle-outline" size={26} color="#007AFF" />
              </TouchableOpacity>
              {!isViewingHidden && (
                <TouchableOpacity style={styles.actionBtn} onPress={addPhoto}>
                  <Ionicons name="add-circle" size={28} color="#007AFF" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.masonryContainer}>
          <View style={styles.column}>
            {leftColumn.map((item) => (
              <Pressable key={item.id} onPress={() => handlePhotoPress(item)} style={styles.imageWrapper}>
                <Image 
                  source={getSource(item)} 
                  style={[styles.image, { height: item.height }]} 
                  contentFit="cover"
                  transition={300}
                />
                {isSelectionMode && (
                  <View style={styles.checkbox}>
                    {selectedIds.has(item.id) && <Ionicons name="checkmark-circle" size={24} color="#007AFF" />}
                    {!selectedIds.has(item.id) && <Ionicons name="ellipse-outline" size={24} color="#FFF" />}
                  </View>
                )}
                {item.isFavorite && !isSelectionMode && (
                  <View style={styles.heartBadge}>
                    <Ionicons name="heart" size={16} color="#FF2D55" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
          <View style={styles.column}>
            {rightColumn.map((item) => (
              <Pressable key={item.id} onPress={() => handlePhotoPress(item)} style={styles.imageWrapper}>
                <Image 
                  source={getSource(item)} 
                  style={[styles.image, { height: item.height }]} 
                  contentFit="cover"
                  transition={300}
                />
                {isSelectionMode && (
                  <View style={styles.checkbox}>
                    {selectedIds.has(item.id) && <Ionicons name="checkmark-circle" size={24} color="#007AFF" />}
                    {!selectedIds.has(item.id) && <Ionicons name="ellipse-outline" size={24} color="#FFF" />}
                  </View>
                )}
                {item.isFavorite && !isSelectionMode && (
                  <View style={styles.heartBadge}>
                    <Ionicons name="heart" size={16} color="#FF2D55" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Full Screen Modal */}
      <Modal visible={!!fullScreenPhoto} transparent={false} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setFullScreenPhoto(null)}
          >
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          
          {fullScreenPhoto && (
            <Image 
              source={getSource(fullScreenPhoto)} 
              style={styles.fullScreenImage} 
              contentFit="contain"
            />
          )}

          <View style={styles.modalBottomBar}>
            {!isViewingHidden && (
              <>
                <TouchableOpacity style={styles.modalAction} onPress={() => sharePhoto(fullScreenPhoto)}>
                  <Ionicons name="share-outline" size={28} color="#FFF" />
                  <Text style={styles.modalActionText}>Share</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.modalAction} onPress={() => saveToGallery(fullScreenPhoto)}>
                  <Ionicons name="download-outline" size={28} color="#FFF" />
                  <Text style={styles.modalActionText}>Save</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.modalAction} onPress={() => toggleFavorite(fullScreenPhoto.id)}>
              <Ionicons name={fullScreenPhoto?.isFavorite ? "heart" : "heart-outline"} size={28} color={fullScreenPhoto?.isFavorite ? "#FF2D55" : "#FFF"} />
              <Text style={styles.modalActionText}>Favorite</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalAction} onPress={() => toggleHidden(fullScreenPhoto.id)}>
              <Ionicons name={fullScreenPhoto?.isHidden ? "eye-outline" : "eye-off-outline"} size={28} color="#FFF" />
              <Text style={styles.modalActionText}>{fullScreenPhoto?.isHidden ? 'Unhide' : 'Hide'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalAction} onPress={() => deleteSinglePhoto(fullScreenPhoto.id)}>
              <Ionicons name="trash-outline" size={28} color="#FF3B30" />
              <Text style={[styles.modalActionText, { color: '#FF3B30' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Password Prompt Modal */}
      <Modal visible={showPasswordPrompt} transparent={true} animationType="fade">
        <View style={styles.passwordModalOverlay}>
          <View style={styles.passwordModal}>
            <Text style={styles.passwordTitle}>Hidden Photos</Text>
            <Text style={styles.passwordSubtitle}>Enter passcode to view</Text>
            <TextInput
              style={styles.passwordInput}
              secureTextEntry
              keyboardType="number-pad"
              autoFocus
              value={passwordInput}
              onChangeText={setPasswordInput}
              maxLength={4}
            />
            <View style={styles.passwordActions}>
              <TouchableOpacity onPress={() => setShowPasswordPrompt(false)}>
                <Text style={styles.passwordCancelBtn}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePasswordSubmit}>
                <Text style={styles.passwordSubmitBtn}>Enter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  masonryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
    gap: 12,
  },
  imageWrapper: {
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#EAEAEA',
  },
  checkbox: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    overflow: 'hidden'
  },
  heartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 4,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  fullScreenImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  modalBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.8)',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  modalAction: {
    alignItems: 'center',
    gap: 4,
  },
  modalActionText: {
    color: '#FFF',
    fontSize: 12,
  },
  // Password prompt styles
  passwordModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordModal: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
  },
  passwordTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  passwordSubtitle: {
    color: '#666',
    marginBottom: 20,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    width: '100%',
    padding: 12,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 24,
  },
  passwordActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  passwordCancelBtn: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordSubmitBtn: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  }
});
