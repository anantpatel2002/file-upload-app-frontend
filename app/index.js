// app/index.js
import React, { useState } from 'react';
import { View, Button, Text, TextInput, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router'; // Import useRouter
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import * as Progress from 'react-native-progress';
import { API_URL } from '../constants'; // Import from constants.js

export default function UploadScreen() {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter(); // Get the router instance

    // Function to select a document (same as before)
    const selectFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.type === 'success') {
                if (!result.name.endsWith('.pdf')) {
                    Alert.alert('Error', 'Please select a .pdf file.');
                    return;
                }
                setFile(result);
                setTitle(result.name.replace('.pdf', ''));
            }
        } catch (err) {
            console.error('Error picking document:', err);
            Alert.alert('Error', 'Failed to pick file.');
        }
    };

    // Function to handle the upload (same as before, with one change)
    const handleUpload = async () => {
        if (!file) {
            Alert.alert('No file selected', 'Please select a PDF file to upload.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', {
            uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
            name: file.name,
            type: file.mimeType || 'application/pdf',
        });
        formData.append('title', title);

        try {
            await axios.post(`${API_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const { loaded, total } = progressEvent;
                    const percent = Math.floor((loaded * 100) / total);
                    setUploadProgress(percent / 100);
                },
            });

            Alert.alert('Success', 'File uploaded successfully!');
            setFile(null);
            setTitle('');
            setUploadProgress(0);
            setIsUploading(false);

            // --- NAVIGATION CHANGE ---
            // Use router.push to navigate to the 'files' tab
            router.push('/files');

        } catch (err) {
            console.error('Error uploading file:', err.response ? err.response.data : err.message);
            let errorMessage = 'Failed to upload file. Please try again.';
            if (err.response && err.response.data && err.response.data.message) {
                errorMessage = err.response.data.message;
            }
            Alert.alert('Upload Error', errorMessage);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Upload a PDF</Text>

            <Button title="Select PDF" onPress={selectFile} disabled={isUploading} />

            {file && (
                <View style={styles.fileInfo}>
                    <Text>Selected: {file.name}</Text>
                    <Text>Size: {Math.round(file.size / 1024)} KB</Text>
                </View>
            )}

            <TextInput
                style={styles.input}
                placeholder="Enter file title (optional)"
                value={title}
                onChangeText={setTitle}
                editable={!isUploading}
            />

            <Button title={isUploading ? "Uploading..." : "Upload File"} onPress={handleUpload} disabled={isUploading || !file} />

            {isUploading && (
                <View style={styles.progressContainer}>
                    <Progress.Bar progress={uploadProgress} width={300} />
                    <Text>{Math.round(uploadProgress * 100)}%</Text>
                </View>
            )}
        </View>
    );
}

// Styles are the same as before
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'white',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    fileInfo: {
        marginTop: 20,
        alignItems: 'center',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        width: '100%',
        marginTop: 20,
        marginBottom: 20,
    },
    progressContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
});