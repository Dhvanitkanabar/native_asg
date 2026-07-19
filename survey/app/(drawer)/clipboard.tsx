import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Share,
  Animated,
  Modal,
  Platform,
  TextInput,
  Alert,
  ScrollView
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from "expo-clipboard";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable } from 'react-native-gesture-handler';
import { 
  Clipboard as ClipboardIcon, Plus, Search, Copy, Trash2, Edit3, 
  Share2, Star, X, Info, CheckCircle 
} from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import * as Haptics from 'expo-haptics';

export default function ClipboardScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [textToCopy, setTextToCopy] = useState("");
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  useEffect(() => {
    loadHistory();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setToastMessage(null));
    }, 2000);
  };

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('@clipboard_history');
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch (e) {
      console.log('Failed to load history', e);
    }
  };

  const saveHistory = async (newHistory: any) => {
    try {
      await AsyncStorage.setItem('@clipboard_history', JSON.stringify(newHistory));
    } catch (e) {
      console.log('Failed to save history', e);
    }
  };

  const copyText = async () => {
    if (textToCopy.trim() === "") {
      showToast("Please enter some text!");
      return;
    }
    await Clipboard.setStringAsync(textToCopy);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const newHistory: any = [
      {
        id: Date.now().toString(),
        text: textToCopy,
        favorite: false,
        time: new Date().toLocaleString(),
      },
      ...history,
    ];
    setHistory(newHistory);
    saveHistory(newHistory);
    
    showToast("Copied Successfully!");
    setTextToCopy("");
  };

  const pasteText = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const value = await Clipboard.getStringAsync();

    if (value.trim() !== "") {
      if (history.length > 0 && (history[0] as any).text === value) {
        showToast("Already pasted!");
        return;
      }
      
      const newHistory: any = [
        {
          id: Date.now().toString(),
          text: value,
          favorite: false,
          time: new Date().toLocaleString(),
        },
        ...history,
      ];
      setHistory(newHistory);
      saveHistory(newHistory);
      showToast("Pasted from clipboard!");
    } else {
      showToast("Clipboard is empty!");
    }
  };

  const deleteItem = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newHistory = history.filter((item: any) => item.id !== id);
    setHistory(newHistory);
    saveHistory(newHistory);
    showToast("Item deleted");
  };

  const deleteAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Clear History", "Permanently delete all clipboard logs?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: () => {
        setHistory([]);
        saveHistory([]);
        showToast("Cleared all history!");
      }}
    ]);
  };

  const copyAgain = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast("Copied Again!");
  };

  const toggleFavourite = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newHistory: any = history.map((item: any) =>
      item.id === id ? { ...item, favorite: !item.favorite } : item
    );
    setHistory(newHistory);
    saveHistory(newHistory);
  };

  const shareText = async (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({ message: text });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const editClip = (item: any) => {
    setEditingItem(item.id);
    setEditingText(item.text);
  };

  const saveEditedClip = () => {
    if (!editingItem) return;
    if (editingText.trim() === "") {
      showToast("Text cannot be empty!");
      return;
    }

    const newHistory: any = history.map((item: any) =>
      item.id === editingItem ? { ...item, text: editingText } : item
    );
    setHistory(newHistory);
    saveHistory(newHistory);
    setEditingItem(null);
    setEditingText("");
    showToast("Clip updated!");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const filteredHistory = history.filter((item: any) => {
    const matchesSearch = item.text.toLowerCase().includes(search.toLowerCase());
    const matchesFavorite = showFavoritesOnly ? item.favorite : true;
    return matchesSearch && matchesFavorite;
  });

  const renderRightActions = (id: string) => {
    return (
      <TouchableOpacity
        style={[styles.deleteSwipe, { backgroundColor: theme.danger }]}
        onPress={() => deleteItem(id)}
      >
        <Trash2 size={22} color="#fff" />
        <Text style={[styles.deleteSwipeText, { fontFamily: Typography.fontFamily.bold }]}>Delete</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={['top']}>
      <AppHeader title="Clipboard Manager" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Copy paste panel */}
        <AppCard variant="elevated" style={styles.card}>
          <AppInput
            placeholder="Type something to copy..."
            value={textToCopy}
            onChangeText={setTextToCopy}
            icon={<ClipboardIcon size={18} color={theme.textTertiary} />}
            containerStyle={{ marginBottom: Spacing.sm }}
          />

          <View style={styles.row}>
            <AppButton 
              title="Copy" 
              onPress={copyText} 
              style={styles.actionBtn}
              icon={<Copy size={16} color="#fff" />}
            />
            <AppButton 
              title="Paste Notes" 
              variant="secondary"
              onPress={pasteText} 
              style={styles.actionBtn}
              icon={<ClipboardIcon size={16} color={theme.text} />}
            />
          </View>
        </AppCard>

        {/* Search bar & Fav filters */}
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <AppInput
              placeholder="Search history..."
              value={search}
              onChangeText={setSearch}
              icon={<Search size={18} color={theme.textTertiary} />}
              containerStyle={{ marginBottom: 0 }}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.favFilterBtn,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border, borderWidth: 1.5 },
              showFavoritesOnly && { backgroundColor: theme.warning, borderColor: theme.warning }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowFavoritesOnly(!showFavoritesOnly);
            }}
          >
            <Star size={16} color={showFavoritesOnly ? '#fff' : theme.textSecondary} fill={showFavoritesOnly ? '#fff' : 'transparent'} />
            <Text style={[styles.favFilterText, { fontFamily: Typography.fontFamily.bold }, showFavoritesOnly ? { color: '#fff' } : { color: theme.textSecondary }]}>
              {showFavoritesOnly ? "Favorites" : "All"}
            </Text>
          </TouchableOpacity>
        </View>

        {history.length > 0 && (
          <TouchableOpacity onPress={deleteAll} style={styles.clearAllBtn}>
            <Trash2 size={14} color={theme.danger} />
            <Text style={[styles.clearAllText, { color: theme.danger, fontFamily: Typography.fontFamily.bold }]}>Clear History</Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={filteredHistory}
          keyExtractor={(item: any) => item.id}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ClipboardIcon size={44} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>No Clipboard History</Text>
            </View>
          }
          renderItem={({ item }: any) => (
            <AppCard variant="elevated" style={{ padding: 0, marginBottom: Spacing.sm, overflow: 'hidden' }}>
              <Swipeable renderRightActions={() => renderRightActions(item.id)}>
                <View style={[styles.historyItem, { backgroundColor: theme.surfaceElevated }]}>
                  <View style={styles.historyRow}>
                    <Text style={[styles.historyText, { color: theme.text, fontFamily: Typography.fontFamily.medium }]} numberOfLines={3}>{item.text}</Text>
                    <TouchableOpacity onPress={() => toggleFavourite(item.id)} style={styles.starBtn}>
                      <Star size={20} color={item.favorite ? theme.warning : theme.textTertiary} fill={item.favorite ? theme.warning : 'transparent'} />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={[styles.time, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>{item.time}</Text>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.actionIconButton, { backgroundColor: theme.surface }]} onPress={() => copyAgain(item.text)}>
                      <Copy size={12} color={theme.text} />
                      <Text style={[styles.actionIconButtonText, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionIconButton, { backgroundColor: theme.surface }]} onPress={() => shareText(item.text)}>
                      <Share2 size={12} color={theme.text} />
                      <Text style={[styles.actionIconButtonText, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionIconButton, { backgroundColor: theme.surface }]} onPress={() => editClip(item)}>
                      <Edit3 size={12} color={theme.text} />
                      <Text style={[styles.actionIconButtonText, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Swipeable>
            </AppCard>
          )}
        />
        
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Toast Alert */}
      {toastMessage && (
        <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
          <CheckCircle size={16} color="#fff" />
          <Text style={[styles.toastText, { fontFamily: Typography.fontFamily.bold }]}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* ====== Edit Modal ====== */}
      <Modal visible={!!editingItem} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <AppCard variant="glass" style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>Edit Clip</Text>
            <TextInput
              style={[styles.modalInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border, fontFamily: Typography.fontFamily.medium }]}
              value={editingText}
              onChangeText={setEditingText}
              multiline
            />
            <View style={styles.modalButtons}>
              <AppButton 
                title="Cancel" 
                variant="outline" 
                onPress={() => setEditingItem(null)} 
                style={{ flex: 1 }}
              />
              <AppButton 
                title="Save" 
                onPress={saveEditedClip} 
                style={{ flex: 1 }}
              />
            </View>
          </AppCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.lg },
  card: { borderWidth: 0, padding: Spacing.lg },
  row: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  actionBtn: { flex: 1 },
  
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.md },
  favFilterBtn: {
    height: 56, flexDirection: 'row', alignItems: 'center', 
    justifyContent: 'center', paddingHorizontal: Spacing.lg, borderRadius: Radius.md, gap: Spacing.xs
  },
  favFilterText: { fontSize: Typography.fontSize.sm },

  clearAllBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, 
    alignSelf: 'flex-end', marginBottom: Spacing.sm, padding: Spacing.xs 
  },
  clearAllText: { fontSize: Typography.fontSize.xs + 1 },

  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.huge, gap: Spacing.sm },
  emptyText: { fontSize: Typography.fontSize.sm },

  // List History
  historyItem: { padding: Spacing.lg },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md },
  historyText: { fontSize: Typography.fontSize.md, flex: 1, lineHeight: 22 },
  starBtn: { padding: 4 },
  time: { fontSize: 10, marginTop: Spacing.xs, marginBottom: Spacing.md },
  
  buttonRow: { flexDirection: 'row', gap: Spacing.sm },
  actionIconButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: Spacing.md, borderRadius: Radius.xs, gap: Spacing.xs },
  actionIconButtonText: { fontSize: Typography.fontSize.xs },

  deleteSwipe: { justifyContent: 'center', alignItems: 'center', width: 74, height: '100%', gap: Spacing.xs },
  deleteSwipeText: { color: '#fff', fontSize: 10 },

  toast: {
    position: "absolute", bottom: 60, alignSelf: "center",
    backgroundColor: "rgba(15,23,42,0.9)", paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, ...Shadows.md
  },
  toastText: { color: "#fff", fontSize: Typography.fontSize.sm },

  // Edit Modal
  modalBackground: { flex: 1, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  modalContent: { width: "100%", padding: Spacing.xl, borderRadius: Radius.xl },
  modalTitle: { fontSize: Typography.fontSize.lg, marginBottom: Spacing.lg, textAlign: "center" },
  modalInput: { borderWidth: 1.5, borderRadius: Radius.md, padding: Spacing.md, minHeight: 100, textAlignVertical: "top", marginBottom: Spacing.lg, fontSize: Typography.fontSize.md },
  modalButtons: { flexDirection: 'row', gap: Spacing.md },
});
