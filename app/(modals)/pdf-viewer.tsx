import { API_BASE_URL } from "@/config/api"; // Ensure this is the correct path
import { UploadedFile, useFilesStore } from "@/store/filesStore"; // Ensure this is the correct path
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Text } from "react-native-paper";
import { WebView } from "react-native-webview";

export default function PdfViewerModal() {
  const router = useRouter();
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getFileById = useFilesStore((s) => s.getFileById);

  useEffect(() => {
    if (fileId) {
      const fetchFile = async () => {
        try {
          setLoading(true);
          const fetchedFile = await getFileById(fileId);
          if (fetchedFile.fileType !== "pdf") {
            throw new Error("This file is not a PDF.");
          }
          setFile(fetchedFile);
          setError(null);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      };
      fetchFile();
    }
  }, [fileId, getFileById]);

  // Construct the direct URL to the file on your server
  const pdfUrl = file ? `${API_BASE_URL}/uploads/${file.filename}` : undefined;

  /**
   * Android cannot render PDFs in a WebView out-of-the-box.
   * We use the Google Docs viewer as a proxy to render it.
   */
  const sourceUri =
    Platform.OS === "android" && pdfUrl
      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
          pdfUrl
        )}`
      : pdfUrl;

  console.log("sourceURI", sourceUri);

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        {file && (
          <View style={styles.headerTitle}>
            <Ionicons name="document-text-outline" size={20} color="#6b7280" />
            <Text style={styles.titleText} numberOfLines={1}>
              {file.title}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text>Loading PDF...</Text>
        </View>
      )}
      {error && (
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Error loading file: {error}</Text>
        </View>
      )}
      {!loading && !error && sourceUri && (
        <WebView
          originWhitelist={["*"]}
          source={{ uri: sourceUri }}
          style={styles.webview}
          startInLoadingState={true}
          renderLoading={() => (
            <ActivityIndicator size="large" style={styles.webviewLoading} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  closeButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
});
