import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFilesStore } from "../../store/filesStore";

export default function SearchScreen() {
  const router = useRouter();
  const { files, loading, fetchFiles, searchFiles, deleteFile } =
    useFilesStore();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<typeof files>([]);
  const [searching, setSearching] = useState<boolean>(false);

  // Fetch files when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchFiles().catch((error) => {
        Alert.alert("Error", "Failed to load files: " + error.message);
      });
    }, [])
  );

  const handleSearch = async (query: string): Promise<void> => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchFiles(query.trim());
      setSearchResults(results);
    } catch (error) {
      Alert.alert("Search Error", (error as Error).message);
    } finally {
      setSearching(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    Alert.alert("Delete File", "Are you sure you want to delete this file?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFile(id);
            // Clear search results if the deleted file was in them
            setSearchResults((prev) => prev.filter((f) => f.id !== id));
          } catch (error) {
            Alert.alert("Delete Error", (error as Error).message);
          }
        },
      },
    ]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const displayFiles = searchQuery ? searchResults : files;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.tabContent}>
          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#9ca3af"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by filename or content..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searching && <ActivityIndicator size="small" color="#3b82f6" />}
            </View>
          </View>

          {/* Search Results */}
          {files.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="document-text" size={40} color="#9ca3af" />
              </View>
              <Text style={styles.emptyTitle}>No files uploaded yet</Text>
              <Text style={styles.emptySubtitle}>
                Upload your first PDF to start searching
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push("/upload")}
              >
                <Text style={styles.emptyButtonText}>Upload PDF</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.resultsContainer}>
              {(searchQuery ? searchResults : files).map((file) => (
                <View key={file.id} style={styles.resultCard}>
                  <View
                    style={[
                      styles.resultIconContainer,
                      {
                        backgroundColor:
                          file.fileType === "video" ? "#3b82f6" : "#ef4444",
                      },
                    ]}
                  >
                    <Ionicons
                      name={file.fileType === "video" ? "videocam" : "document"}
                      size={24}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {file.title}
                    </Text>
                    <View style={styles.resultMeta}>
                      <Text style={styles.resultMetaText}>
                        {formatFileSize(file.size)}
                      </Text>
                      <Text style={styles.resultMetaText}> • </Text>
                      <Text style={styles.resultMetaText}>
                        {new Date(file.uploadDate).toLocaleString()}
                      </Text>
                    </View>
                    {searchQuery &&
                      file.extractedText
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) && (
                        <Text style={styles.resultSnippet} numberOfLines={2}>
                          ...
                          {file.extractedText.substring(
                            Math.max(
                              0,
                              file.extractedText
                                .toLowerCase()
                                .indexOf(searchQuery.toLowerCase()) - 30
                            ),
                            file.extractedText
                              .toLowerCase()
                              .indexOf(searchQuery.toLowerCase()) + 100
                          )}
                          ...
                        </Text>
                      )}
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.viewButton}>
                      <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(file.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {searchQuery && searchResults.length === 0 && (
                <View style={styles.noResults}>
                  <Ionicons name="alert-circle" size={48} color="#9ca3af" />
                  <Text style={styles.noResultsTitle}>No results found</Text>
                  <Text style={styles.noResultsSubtitle}>
                    Try searching with different keywords
                  </Text>
                </View>
              )}
            </View>
          )}
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
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  searchBarContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#111827",
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 48,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#3b82f6",
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  resultsContainer: {
    gap: 16,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  resultMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  resultMetaText: {
    fontSize: 14,
    color: "#6b7280",
  },
  resultSnippet: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },
  noResults: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 48,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 12,
    marginBottom: 8,
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  loadingContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 48,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#fee2e2",
  },
});
