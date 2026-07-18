import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  TextInput,
  FlatList,
  TouchableOpacity,
  Share,
  Animated,
  Modal,
  Platform
} from "react-native";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

export default function ClipboardScreen() {
  const [textToCopy, setTextToCopy] = useState("");
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingText, setEditingText] = useState("");
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  useEffect(() => {
    loadHistory();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
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

  const saveHistory = async (newHistory) => {
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
    
    // Automatically add it to our history if we copy from here
    const newHistory = [
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
    const value = await Clipboard.getStringAsync();

    if (value.trim() !== "") {
      // Don't add duplicate if it's already the most recent
      if (history.length > 0 && history[0].text === value) {
        showToast("Already pasted!");
        return;
      }
      
      const newHistory = [
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

  const deleteItem = (id) => {
    const newHistory = history.filter((item) => item.id !== id);
    setHistory(newHistory);
    saveHistory(newHistory);
  };

  const deleteAll = () => {
    setHistory([]);
    saveHistory([]);
    showToast("Cleared all data!");
  };

  const copyAgain = async (text) => {
    await Clipboard.setStringAsync(text);
    showToast("Copied Again!");
  };

  const toggleFavourite = (id) => {
    const newHistory = history.map((item) =>
      item.id === id ? { ...item, favorite: !item.favorite } : item
    );
    setHistory(newHistory);
    saveHistory(newHistory);
  };

  const shareText = async (text) => {
    try {
      await Share.share({ message: text });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const editClip = (item) => {
    setEditingItem(item.id);
    setEditingText(item.text);
  };

  const saveEditedClip = () => {
    if (!editingItem) return;
    
    if (editingText.trim() === "") {
      showToast("Text cannot be empty!");
      return;
    }

    const newHistory = history.map((item) =>
      item.id === editingItem ? { ...item, text: editingText } : item
    );
    setHistory(newHistory);
    saveHistory(newHistory);
    setEditingItem(null);
    setEditingText("");
    showToast("Clip updated!");
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.text.toLowerCase().includes(search.toLowerCase());
    const matchesFavorite = showFavoritesOnly ? item.favorite : true;
    return matchesSearch && matchesFavorite;
  });

  const renderRightActions = (id) => {
    return (
      <TouchableOpacity
        style={styles.deleteSwipe}
        onPress={() => deleteItem(id)}
      >
        <Ionicons name="trash-outline" size={24} color="#fff" />
        <Text style={styles.deleteSwipeText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clipboard Manager</Text>
      <Text style={styles.subtitle}>Save notes, IDs, and locations</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type something to copy..."
          placeholderTextColor="#999"
          value={textToCopy}
          onChangeText={setTextToCopy}
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
        />
        {textToCopy.length > 0 && (
          <TouchableOpacity onPress={() => setTextToCopy("")} style={styles.clearIcon}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.primaryButton} onPress={copyText}>
          <Ionicons name="copy-outline" size={20} color="#fff" style={{marginRight: 6}} />
          <Text style={styles.primaryButtonText}>Copy</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={pasteText}>
          <Ionicons name="clipboard-outline" size={20} color="#fff" style={{marginRight: 6}} />
          <Text style={styles.secondaryButtonText}>Paste Notes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TextInput
          placeholder="Search clips..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
        />
        <TouchableOpacity
          style={[styles.favFilterBtn, showFavoritesOnly && styles.favFilterActive]}
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Text style={[styles.favFilterText, showFavoritesOnly && styles.favFilterTextActive]}>
            {showFavoritesOnly ? "★ Favs" : "☆ All"}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ marginBottom: 15, alignSelf: 'flex-end' }}>
        <TouchableOpacity onPress={deleteAll}>
          <Text style={{ color: 'red', fontWeight: '600' }}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Ionicons name="clipboard-outline" size={60} color="#ccc" />
            <Text style={styles.empty}>No Clipboard History</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Swipeable renderRightActions={() => renderRightActions(item.id)}>
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={styles.text} numberOfLines={3}>{item.text}</Text>
                <TouchableOpacity onPress={() => toggleFavourite(item.id)} style={{ padding: 4 }}>
                  <Text style={styles.star}>
                    {item.favorite ? "⭐" : "☆"}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.time}>{item.time}</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => copyAgain(item.text)}>
                  <Ionicons name="copy-outline" size={16} color="#333" />
                  <Text style={styles.actionBtnText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => shareText(item.text)}>
                  <Ionicons name="share-social-outline" size={16} color="#333" />
                  <Text style={styles.actionBtnText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => editClip(item)}>
                  <Ionicons name="pencil-outline" size={16} color="#333" />
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Swipeable>
        )}
      />

      {toastMessage && (
        <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* Edit Modal */}
      <Modal visible={!!editingItem} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Clip</Text>
            <TextInput
              style={styles.modalInput}
              value={editingText}
              onChangeText={setEditingText}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#FF3B30' }]} onPress={() => setEditingItem(null)}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#007AFF' }]} onPress={saveEditedClip}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  clearIcon: {
    marginLeft: -35,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    alignItems: "center",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#34C759",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  favFilterBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  favFilterActive: {
    backgroundColor: "#F59E0B",
  },
  favFilterText: {
    fontWeight: "bold",
    color: "#4B5563",
  },
  favFilterTextActive: {
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    color: "#111827",
    marginBottom: 8,
    paddingRight: 30,
    lineHeight: 22,
  },
  time: {
    color: "#9CA3AF",
    marginBottom: 12,
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 10,
  },
  actionBtn: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtnText: {
    color: "#4B5563",
    fontWeight: "600",
    marginLeft: 4,
    fontSize: 13,
  },
  star: {
    fontSize: 20,
  },
  empty: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  deleteSwipe: {
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginVertical: 8,
    borderRadius: 16,
    marginLeft: 10,
  },
  deleteSwipeText: {
    color: "#fff",
    fontWeight: "bold",
    marginTop: 4,
  },
  toast: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(17,24,39,0.9)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  toastText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 20,
    padding: 24,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 24,
    fontSize: 16,
    color: "#111827",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  }
});
