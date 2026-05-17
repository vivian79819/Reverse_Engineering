import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TextToImageApp() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);

  const API_KEY = process.env.EXPO_PUBLIC_API_KEY || '';

  const BASE_URL = 'https://ai.elliottwen.info';

  const generateImage = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt first.');
      return;
    }

    setLoading(true);
    setImageUrl(null);
    setStatusText('Authenticating...');

    // Initialize an AbortController to allow cancelling the request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // 1. Make Auth Request
      const generateResponse = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/generate-image`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
      }),
    });

      const data = await generateResponse.json();

      setImageUrl(data.imageUrl);
      setStatusText('');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setStatusText('Request cancelled.');
      } else {
        setStatusText('An error occurred.');
        Alert.alert('Error', error.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const saveToAlbum = async () => {
    if (!imageUrl) return;

    try {
      // 1. Request write-only permissions to avoid audio permission errors
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to save the image.');
        return;
      }

      setStatusText('Saving to gallery...');

      // 2. Download the image to a temporary local file
      const fileUri = `${FileSystem.documentDirectory}${Date.now()}_ai_image.jpg`;
      const downloadedFile = await FileSystem.downloadAsync(imageUrl, fileUri);

      // 3. Save to media library
      const asset = await MediaLibrary.createAssetAsync(downloadedFile.uri);
      await MediaLibrary.createAlbumAsync('AI Images', asset, false);

      setStatusText('');
      Alert.alert('Success', 'Image saved to your gallery successfully!');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', `Failed to save the image: ${error.message || 'Unknown error'}`);
      setStatusText('');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>AI Image Gen</Text>
          <Text style={styles.headerSubtitle}>Turn your imagination into reality</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Describe what you want to see..."
            placeholderTextColor="#888"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            editable={!loading}
          />
        </View>

        <View style={styles.actionContainer}>
          {loading ? (
            <TouchableOpacity style={styles.cancelBtn} onPress={cancelRequest}>
              <Text style={styles.btnText}>Stop Waiting (Cancel)</Text>
            </TouchableOpacity>
          ) : imageUrl ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.generateBtn, { flex: 1, marginRight: 8 }]} onPress={generateImage}>
                <Text style={styles.btnText}>Generate Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { flex: 1, marginLeft: 8 }]} onPress={saveToAlbum}>
                <Text style={styles.btnText}>Save to Album</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.generateBtn} onPress={generateImage}>
              <Text style={styles.btnText}>Generate Image</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.imagePreviewContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6c5ce7" />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          ) : imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>Your masterpiece will appear here</Text>
            </View>
          )}
        </View>

        {statusText && !loading && (
          <Text style={styles.statusMsg}>{statusText}</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 80, // Added more padding at the bottom so the save button is easier to push
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    marginTop: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: '#1c1c24',
    color: '#ffffff',
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    fontSize: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#2d2d3a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  actionContainer: {
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  generateBtn: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelBtn: {
    backgroundColor: '#e17055',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#e17055',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  imagePreviewContainer: {
    flex: 1,
    backgroundColor: '#1c1c24',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d2d3a',
    minHeight: 350,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderText: {
    color: '#555',
    fontSize: 16,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#a0a0a0',
    marginTop: 15,
    fontSize: 16,
  },
  statusMsg: {
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 10,
  },
  saveContainer: {
    marginTop: 10,
    marginBottom: 60, // Added more bottom margin to push it up
  },
  saveBtn: {
    backgroundColor: '#00b894',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#00b894',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
