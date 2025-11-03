import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text, TextInput } from "react-native-paper";
import { useFilesStore } from "../../store/filesStore";

export default function UploadScreen() {
  const router = useRouter();
  const { uploadFile } = useFilesStore();

  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const [bandwidth, setBandwidth] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [title, setTitle] = useState<string>("");

  const pickDocument = async (): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        // Reset all progress-related state
        clearFile(false); // `false` to keep the selected file
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick document");
      console.error(err);
    }
  };

  const handleUpload = async (): Promise<void> => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setBandwidth("Calculating...");
    setEstimatedTime(null);

    const startTime = Date.now();

    const onProgress = (progress: { loaded: number; total: number }) => {
      const { loaded, total } = progress;
      console.log("loaded ", loaded);
      console.log("total ", total);

      const effectiveLoaded = Math.min(loaded, total);

      // 1. Update Progress Bar
      const percentComplete =
        total > 0
          ? Math.min(100, Math.round((effectiveLoaded / progress.total) * 100))
          : 0;

      setUploadProgress(percentComplete);

      const currentTime = Date.now();
      const elapsedSeconds = (currentTime - startTime) / 1000;

      if (elapsedSeconds > 0.1) {
        // 2. Calculate Real-time Speed (Bandwidth)
        const bytesPerSecond = effectiveLoaded / elapsedSeconds;

        if (bytesPerSecond > 0) {
          const speedMbps = ((bytesPerSecond * 8) / (1024 * 1024)).toFixed(2);
          setBandwidth(speedMbps);

          // 3. Calculate Estimated Time Remaining
          const remainingBytes = total - effectiveLoaded;
          const remainingSeconds = remainingBytes / bytesPerSecond;
          setEstimatedTime(remainingSeconds);
        }
      }
    };

    try {
      // Use the updated store function, passing the onProgress callback
      await uploadFile(
        selectedFile,
        title.trim() ? title.trim() + ".pdf" : undefined,
        onProgress
      );

      // Finalize UI state on success
      setUploadProgress(100);
      setUploading(false);
      setUploadComplete(true);
      setEstimatedTime(0);

      const totalTime = (Date.now() - startTime) / 1000;
      if (totalTime > 0 && selectedFile.size) {
        const avgBytesPerSecond = selectedFile.size / totalTime;
        const avgSpeedMbps = ((avgBytesPerSecond * 8) / (1024 * 1024)).toFixed(
          2
        );
        setBandwidth(avgSpeedMbps);
      }

      // Navigate to search screen after a short delay
      setTimeout(() => {
        clearFile();
        router.push("/search");
      }, 1500);
    } catch (error) {
      setUploading(false);
      setUploadProgress(0); // Reset progress on failure
      setBandwidth(null);
      setEstimatedTime(null);
      Alert.alert("Upload Failed", (error as Error).message);
    }
  };

  const clearFile = (clearSelection = true): void => {
    if (clearSelection) {
      setSelectedFile(null);
      setTitle("");
    }
    setUploadProgress(0);
    setUploadComplete(false);
    setEstimatedTime(null);
    setBandwidth(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 1) return "< 1s";
    if (seconds < 60) return Math.ceil(seconds) + "s";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <View style={styles.container}>
      {/* Real-time Bandwidth Indicator */}
      {bandwidth && uploading && (
        <View style={styles.bandwidthContainer}>
          <Ionicons name="wifi" size={16} color="#16a34a" />
          <Text style={styles.bandwidthText}>
            Upload Speed: {bandwidth} Mbps
          </Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.tabContent}>
          {/* Upload Card */}
          <View style={styles.uploadCard}>
            <TouchableOpacity
              style={[
                styles.uploadArea,
                selectedFile && styles.uploadAreaActive,
              ]}
              onPress={pickDocument}
              disabled={uploading}
            >
              <View
                style={[
                  styles.uploadIcon,
                  selectedFile && styles.uploadIconActive,
                ]}
              >
                <Ionicons
                  name="cloud-upload"
                  size={32}
                  color={selectedFile ? "#fff" : "#9ca3af"}
                />
              </View>
              <Text style={styles.uploadTitle}>
                {selectedFile ? "File Selected" : "Choose a PDF file"}
              </Text>
              <Text style={styles.uploadSubtitle}>
                {selectedFile ? "Ready to upload" : "Tap to browse files"}
              </Text>
            </TouchableOpacity>

            {/* File Preview & Progress */}
            {selectedFile && (
              <View style={styles.filePreview}>
                <View style={styles.filePreviewContent}>
                  <View style={styles.fileIconContainer}>
                    <Ionicons name="document-text" size={24} color="#fff" />
                  </View>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {title.trim().length > 0
                        ? title.trim() + ".pdf"
                        : selectedFile.name}
                    </Text>
                    <Text style={styles.fileSize}>
                      {formatFileSize(selectedFile.size || 0)}
                    </Text>
                    {estimatedTime !== null && uploading && !uploadComplete && (
                      <View style={styles.estimatedTimeContainer}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#6b7280"
                        />
                        <Text style={styles.estimatedTimeText}>
                          {estimatedTime > 0
                            ? `~${formatTime(estimatedTime)} remaining`
                            : "Finalizing..."}
                        </Text>
                      </View>
                    )}
                  </View>
                  {!uploading && !uploadComplete && (
                    <TouchableOpacity
                      onPress={() => clearFile()}
                      style={styles.clearButton}
                    >
                      <Ionicons name="close-circle" size={24} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Progress Bar */}
                {(uploading || uploadComplete) && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressText}>
                        {uploadComplete ? "Complete" : "Uploading..."}
                      </Text>
                      <Text style={styles.progressPercent}>
                        {uploadProgress}%
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${uploadProgress}%`,
                            backgroundColor: uploadComplete
                              ? "#16a34a"
                              : "#3b82f6",
                          },
                        ]}
                      />
                    </View>
                  </View>
                )}

                {/* Success Message */}
                {uploadComplete && (
                  <View style={styles.successContainer}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#16a34a"
                    />
                    <Text style={styles.successText}>
                      Upload successful! Redirecting...
                    </Text>
                  </View>
                )}

                {/* Title Input - Hidden during/after upload */}
                {!uploading && !uploadComplete && (
                  <TextInput
                    label={"Rename File Title (Optional)"}
                    value={title}
                    onChangeText={setTitle}
                    placeholder={selectedFile.name.substring(
                      0,
                      selectedFile.name.lastIndexOf(".") > 0
                        ? selectedFile.name.lastIndexOf(".")
                        : selectedFile.name.length
                    )}
                    style={styles.fileTitleInput}
                    right={<TextInput.Affix text=".pdf" />}
                    mode="outlined"
                  />
                )}
              </View>
            )}

            {/* Action Buttons */}
            {selectedFile && !uploading && !uploadComplete && (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUpload}
              >
                <Text style={styles.uploadButtonText}>Upload PDF</Text>
              </TouchableOpacity>
            )}

            {uploadComplete && (
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => {
                  clearFile();
                  router.push("/search");
                }}
              >
                <Text style={styles.searchButtonText}>Go to Search</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Info Cards - No changes needed here */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <View
                style={[
                  styles.infoIconContainer,
                  { backgroundColor: "#dbeafe" },
                ]}
              >
                <Ionicons
                  name="checkmark-done-circle-outline"
                  size={20}
                  color="#3b82f6"
                />
              </View>
              <View>
                <Text style={styles.infoLabel}>Supported</Text>
                <Text style={styles.infoValue}>PDF Only</Text>
              </View>
            </View>
            <View style={styles.infoCard}>
              <View
                style={[
                  styles.infoIconContainer,
                  { backgroundColor: "#e9d5ff" },
                ]}
              >
                <Ionicons
                  name="file-tray-full-outline"
                  size={20}
                  color="#9333ea"
                />
              </View>
              <View>
                <Text style={styles.infoLabel}>Max Size</Text>
                <Text style={styles.infoValue}>100 MB</Text>
              </View>
            </View>
            <View style={styles.infoCard}>
              <View
                style={[
                  styles.infoIconContainer,
                  { backgroundColor: "#dcfce7" },
                ]}
              >
                <Ionicons
                  name="search-circle-outline"
                  size={20}
                  color="#16a34a"
                />
              </View>
              <View>
                <Text style={styles.infoLabel}>Feature</Text>
                <Text style={styles.infoValue}>Full-text Search</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  bandwidthContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#dcfce7",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#a7f3d0",
  },
  bandwidthText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#166534",
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  uploadCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
  },
  uploadAreaActive: {
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff",
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  uploadIconActive: {
    backgroundColor: "#3b82f6",
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  filePreview: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filePreviewContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: "#6b7280",
  },
  fileTitleInput: {
    backgroundColor: "#fff",
    marginTop: 16,
  },
  estimatedTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  estimatedTimeText: {
    fontSize: 14,
    color: "#475569",
  },
  clearButton: {
    padding: 6,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  successText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#166534",
  },
  uploadButton: {
    marginTop: 20,
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  searchButton: {
    marginTop: 20,
    backgroundColor: "#16a34a",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  infoCards: {
    gap: 12,
  },
  infoCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
});
