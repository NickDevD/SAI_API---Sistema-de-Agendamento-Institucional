import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1`;

export const api = axios.create({
    baseURL: BASE_URL,
});

// Adiciona o token JWT no header de cada requisição
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Redireciona para login quando o token expirar (401), exceto na própria chamada de login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginCall = error.config?.url?.includes('/auth/login');
        if (error.response?.status === 401 && !isLoginCall) {
            localStorage.removeItem('auth_token');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);
