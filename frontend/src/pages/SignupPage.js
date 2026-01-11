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

  // Function to merge guest cart with user's cart after signup
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
      const response = await axios.post(`${API}/auth/signup`, formData);
      const token = response.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Merge guest cart with user's cart
      await mergeGuestCart(token);
      
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img 
              src="https://customer-assets.emergentagent.com/job_cake-commerce-4/artifacts/qna9h32i_IMG-4835.PNG" 
              alt="Milkbites by Keka Cakery" 
              className="h-48 w-auto object-contain mx-auto mb-4"
            />
          </Link>
          <p className="text-muted-foreground">Create a new account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Full Name
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
                WhatsApp Number
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
              {loading ? 'Processing...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
