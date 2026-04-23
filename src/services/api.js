// src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "https://debat-jeune-production.up.railway.app/api", 
  timeout: 10000, // 10 secondes max
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor bech nzidou token automatiquement
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Optionnel : Gérer les erreurs de réponse globalement (ex: redirection si token expiré)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Logique de déconnexion si nécessaire
    }
    return Promise.reject(error);
  }
);

export default API;