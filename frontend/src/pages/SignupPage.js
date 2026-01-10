import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SignupPage = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    whatsapp: '08',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/signup`, formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Pendaftaran berhasil!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Pendaftaran gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-bold text-accent mb-2">Milkbites</h1>
          </Link>
          <p className="text-muted-foreground">Buat akun baru</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Nama Lengkap
              </label>
              <input
                data-testid="fullname-input"
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Email
              </label>
              <input
                data-testid="email-input"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Nomor WhatsApp
              </label>
              <input
                data-testid="whatsapp-input"
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
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
                data-testid="password-input"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              data-testid="signup-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-full hover:bg-primary/90 transition-all disabled:opacity-50 font-medium"
            >
              {loading ? 'Memproses...' : 'Daftar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
