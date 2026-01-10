import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import '@/App.css';
import HomePage from './pages/HomePage';
import AllProductsPage from './pages/AllProductsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import CustomerDashboard from './pages/CustomerDashboard';
import OrderDetailPage from './pages/OrderDetailPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ThemeCustomizer from './components/ThemeCustomizer';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return token && user.is_admin ? children : <Navigate to="/admin/login" />;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<AllProductsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
          <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
          <Route path="/payment/:orderId" element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><CustomerDashboard /></PrivateRoute>} />
          <Route path="/order/:orderId" element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
