import axios from "axios";

const rawBaseURL =
  import.meta?.env?.VITE_API_URL ||
  process?.env?.REACT_APP_API_URL ||
  "https://debat-jeune-production.up.railway.app/api";

// نحيدو slash في الأخير كان موجود
const baseURL = rawBaseURL.replace(/\/$/, "");

const API = axios.create({
  baseURL,
  timeout: 120000,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    // إذا token فيه Bearer already، نحيدوه
    const cleanToken = token.startsWith("Bearer ")
      ? token.slice(7)
      : token;

    req.headers = req.headers || {};
    req.headers.Authorization = `Bearer ${cleanToken}`;
  }

  return req;
});

API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      console.log("Unauthorized 401:", error.response?.data);
    }
    return Promise.reject(error);
  }
);

console.log("API baseURL =", API.defaults.baseURL);

export default API;