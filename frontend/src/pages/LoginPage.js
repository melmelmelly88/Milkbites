import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoginPage = () => {
  const [whatsapp, setWhatsapp] = useState('08');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Function to merge guest cart with user's cart after login
  const mergeGuestCart = async (token) => {
    try {
      const guestCartStr = localStorage.getItem('guestCart');
      if (!guestCartStr) return;
      
      const guestCart = JSON.parse(guestCartStr);
      if (!guestCart.items || guestCart.items.length === 0) return;
      
      // Add each guest cart item to the user's cart
      for (const item of guestCart.items) {
        try {
          await axios.post(
            `${API}/cart/add`,
            {
              product_id: item.product_id,
              quantity: item.quantity,
              customization: item.customization
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
        } catch (err) {
          console.error('Failed to merge item:', item.product_id);
        }
      }
      
      // Clear guest cart after successful merge
      localStorage.removeItem('guestCart');
      toast.success('Your cart items have been saved!');
    } catch (error) {
      console.error('Failed to merge guest cart:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        whatsapp,
        password
      });

      const token = response.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Merge guest cart with user's cart
      await mergeGuestCart(token);
      
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img 
              src="https://customer-assets.emergentagent.com/job_cake-commerce-4/artifacts/qna9h32i_IMG-4835.PNG" 
              alt="Milkbites by Keka Cakery" 
              className="h-16 w-auto object-contain mx-auto mb-4"
            />
          </Link>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                WhatsApp Number
              </label>
              <input
                data-testid="whatsapp-input"
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
                data-testid="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-full hover:bg-primary/90 transition-all disabled:opacity-50 font-medium"
            >
              {loading ? 'Processing...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
