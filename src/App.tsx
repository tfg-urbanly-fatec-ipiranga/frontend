import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from './pages/Register';
import RegisterEstablishmentPage from './pages/RegisterEstablishment';
import LoginPage from './pages/Login';
import EditProfilePage from './pages/EditProfile';
import EditEstablishmentPage from './pages/EditEstablishment';
import HomePage from './pages/Home';
import EstablishmentListPage from './pages/EstablishmentList';
import EstablishmentDetailsPage from './pages/EstablishmentDetails';
import FavoritesPage from './pages/Favorites';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import React from "react";

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
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
