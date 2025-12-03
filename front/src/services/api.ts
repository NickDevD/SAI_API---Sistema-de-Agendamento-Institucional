import axios from 'axios';

// Cria an instância base com a URL do Backend
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
    baseURL: BASE_URL,
});

// Interceptor: Adiciona o Token JWT ao cabeçalho antes de enviar a requisição
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');

        if (token) {
            // Formato exigido pelo Spring Security
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);