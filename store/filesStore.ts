import axios from "axios";
import { create } from "zustand";
import { API_ENDPOINTS } from "../config/api";

export interface UploadedFile {
  id: string;
  title: string;
  originalname: string;
  size: number;
  uploadDate: string;
  snippet?: string;
  extractedText?: string;
}

interface FilesStore {
  files: UploadedFile[];
  loading: boolean;
  error: string | null;
  fetchFiles: () => Promise<void>;
  uploadFile: (
    file: any,
    title: string | undefined,
    onProgress: (progress: { loaded: number; total: number }) => void
  ) => Promise<UploadedFile>;
  searchFiles: (query: string) => Promise<UploadedFile[]>;
  deleteFile: (id: string) => Promise<void>;
  getFileById: (id: string) => Promise<UploadedFile>;
}

export const useFilesStore = create<FilesStore>((set, get) => ({
  files: [],
  loading: false,
  error: null,

  fetchFiles: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(API_ENDPOINTS.files);
      if (!response.ok) throw new Error("Failed to fetch files");
      const data = await response.json();
      set({ files: data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  uploadFile: async (file, title, onProgress) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        type: file.mimeType || "application/pdf",
        name: file.name,
      } as any);

      if (title) {
        formData.append("title", title);
      }

      const response = await axios.post(API_ENDPOINTS.upload, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        // For tracking upload progress with axios
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
            });
          }
        },
      });

      await get().fetchFiles(); // Refresh file list after successful upload
      set({ loading: false });
      return response.data.file;
    } catch (error: any) {
      // Handle potential errors from axios
      const errorMessage =
        error.response?.data?.message || error.message || "Upload failed";
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  searchFiles: async (query) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_ENDPOINTS.search}?query=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      set({ loading: false });
      return data;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteFile: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(API_ENDPOINTS.deleteFile(id), {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed");
      await get().fetchFiles(); // Refresh file list
      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  getFileById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(API_ENDPOINTS.fileById(id));
      if (!response.ok) throw new Error("Failed to fetch file");
      const data = await response.json();
      set({ loading: false });
      return data;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
}));
