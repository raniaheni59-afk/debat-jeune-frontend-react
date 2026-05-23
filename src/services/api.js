import axios from "axios";

const baseURL =
  import.meta?.env?.VITE_API_URL ||
  "https://debat-jeune.onrender.com/api";

const API = axios.create({
  baseURL,
  timeout: 120000, 
  
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