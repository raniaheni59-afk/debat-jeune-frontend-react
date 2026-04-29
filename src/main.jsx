import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; 
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
    <Routes>
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/profile/1" />} />
      </Routes>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);