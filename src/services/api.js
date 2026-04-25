import axios from "axios";

const baseURL =
  // Vite
  import.meta?.env?.VITE_API_URL ||
  // CRA
  process?.env?.REACT_APP_API_URL ||
  // fallback
  "https://debat-jeune-production.up.railway.app/api";

const API = axios.create({
  baseURL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // optional: logout / clear token
      // localStorage.removeItem("token");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;