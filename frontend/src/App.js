import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import * as serviceWorker from './services/serviceWorker';
import syncService from './services/sync';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Invoices from './pages/Invoices';
import POS from './pages/POS';
import Reports from './pages/Reports';
import GST from './pages/GST';
import Settings from './pages/Settings';
import './styles/themes.css';

function App() {
  useEffect(() => {
    // Register service worker for background sync
    serviceWorker.register({
      onSuccess: () => {
        console.log('Service Worker registered successfully');
        syncService.registerBackgroundSync();
      },
      onUpdate: () => {
        console.log('Service Worker updated');
      }
    });
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/gst" element={<GST />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Welcome to setLedger
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  AI-Powered Financial Management Suite
                </p>
                <div className="space-x-4">
                  <button 
                    onClick={() => window.location.href = '/login'}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    title="Sign in to your existing account"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => window.location.href = '/register'}
                    className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                    title="Create a new organization and admin account"
                  >
                    Create Organization
                  </button>
                </div>
              </div>
            </div>
          } />

        </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;