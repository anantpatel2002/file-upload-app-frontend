const IP_ADDRESS = "your_ip_address";
export const API_BASE_URL = `http://${IP_ADDRESS}:3000`;

export const API_ENDPOINTS = {
  upload: `${API_BASE_URL}/upload`,
  files: `${API_BASE_URL}/files`,
  search: `${API_BASE_URL}/search`,
  fileById: (id: string) => `${API_BASE_URL}/files/${id}`,
  deleteFile: (id: string) => `${API_BASE_URL}/files/${id}`,
};

// // For production, use your actual backend server URL
// export const API_BASE_URL = __DEV__ 
//   ? 'http://localhost:3001'  // Change to '10.0.2.2' for Android emulator or your IP for physical device
//   : 'https://your-production-api.com';
