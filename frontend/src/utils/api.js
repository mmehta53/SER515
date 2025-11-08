import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Create an axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Required for cookies to be sent/received
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to add the token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;