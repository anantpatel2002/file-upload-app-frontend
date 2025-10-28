// app/files.js
import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { useFocusEffect } from 'expo-router'; // Import from expo-router
import axios from 'axios';
import { API_URL } from '../constants'; // Import from constants.js

// Helper to format date
const formatDate = (isoString) => {
    try {
        return new Date(isoString).toLocaleDateString();
    } catch (e) {
        return 'Invalid Date';
    }
};

export default function FileListScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Function to fetch files
    const fetchFiles = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/files`);
            setFiles(response.data);
        } catch (error) {
            console.error('Error fetching files:', error);
            alert('Failed to fetch files.');
        } finally {
            setIsLoading(false);
        }
    };

    // Function to handle search
    const searchForFiles = async (query) => {
        if (!query) {
            fetchFiles(); // If search is cleared, fetch all files
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/search`, {
                params: { query: query },
            });
            setFiles(response.data);
        } catch (error) {
            console.error('Error searching files:', error);
            alert('Failed to search files.');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch files when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchFiles();
        }, [])
    );

    // Handle pull-to-refresh
    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        setSearchQuery(''); // Clear search on refresh
        fetchFiles().then(() => setIsRefreshing(false));
    }, []);

    // Render item for FlatList
    const renderItem = ({ item }) => (
        <View style={styles.fileItem}>
            <Text style={styles.fileTitle}>{item.title}</Text>
            <Text style={styles.fileName}>{item.originalname}</Text>
            <Text style={styles.fileDate}>Uploaded: {formatDate(item.uploadDate)}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Uploaded Files</Text>

            <TextInput
                style={styles.searchBar}
                placeholder="Search by name, title, or content..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => searchForFiles(searchQuery)}
            />

            <TouchableOpacity
                style={styles.searchButton}
                onPress={() => searchForFiles(searchQuery)}
            >
                <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>

            {isLoading && !isRefreshing ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <FlatList
                    data={files}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No files found.</Text>}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                    }
                />
            )}
        </SafeAreaView>
    );
}

// Styles are the same, added SafeAreaView
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: 'white',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    searchBar: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        paddingLeft: 10,
        marginBottom: 10,
    },
    searchButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
    },
    searchButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    list: {
        flex: 1,
    },
    fileItem: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        borderRadius: 5,
        marginBottom: 10,
    },
    fileTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    fileName: {
        fontSize: 14,
        color: '#555',
    },
    fileDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: 'gray',
    },
});