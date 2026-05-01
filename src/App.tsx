import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import RegisterPage from './pages/Register';
import RegisterEstablishmentPage from './pages/RegisterEstablishment';
import LoginPage from './pages/Login';
import EditProfilePage from './pages/EditProfile';
import EditEstablishmentPage from './pages/EditEstablishment';
import HomePage from './pages/Home';
import EstablishmentListPage from './pages/EstablishmentList';
import EstablishmentDetailsPage from './pages/EstablishmentDetails';
import FavoritesPage from './pages/Favorites';
import InactiveRecordsPage from './pages/InactiveRecords';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import React from "react";
import 'react-toastify/dist/ReactToastify.css';

function isAdmin(): boolean {
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    const user = parsed.user || parsed;
    return user.role === 'ADMIN';
  } catch {
    return false;
  }
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  if (!isAdmin()) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register-establishment" element={<RegisterEstablishmentPage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/edit-establishment/:id" element={<EditEstablishmentPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/establishments" element={<EstablishmentListPage />} />
          <Route path="/establishment/:id" element={<EstablishmentDetailsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/admin/inactive" element={<AdminRoute><InactiveRecordsPage /></AdminRoute>} />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
      <ToastContainer position="top-center" autoClose={3000} />
    </AuthProvider>
  );
}

export default App;
