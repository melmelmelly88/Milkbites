import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminLogin = () => {
  const [whatsapp, setWhatsapp] = useState('08');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/admin/login`, {
        whatsapp,
        password
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Login admin berhasil!');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-accent mb-2">Admin Login</h1>
          <p className="text-muted-foreground">Milkbites Dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Nomor WhatsApp Admin
              </label>
              <input
                data-testid="admin-whatsapp-input"
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="08123456789"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Password
              </label>
              <input
                data-testid="admin-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              data-testid="admin-login-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-full hover:bg-primary/90 transition-all disabled:opacity-50 font-medium"
            >
              {loading ? 'Memproses...' : 'Login sebagai Admin'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-primary hover:underline text-sm">
              ← Kembali ke Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
