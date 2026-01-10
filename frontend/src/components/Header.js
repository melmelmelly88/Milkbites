import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, LogOut } from 'lucide-react';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const categories = [
    { name: 'Cookies', path: '/?category=Cookies' },
    { name: 'Babka', path: '/?category=Babka' },
    { name: 'Cake', path: '/?category=Cake' },
    { name: 'Hampers', path: '/?category=Hampers' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Burger Menu */}
          <button
            data-testid="burger-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            {menuOpen ? <X size={24} className="text-accent" /> : <Menu size={24} className="text-accent" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-accent">Milkbites</h1>
          </Link>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            {token ? (
              <>
                <Link to="/cart" data-testid="cart-link">
                  <ShoppingCart className="text-accent hover:text-primary transition-colors" size={24} />
                </Link>
                <Link to="/dashboard" data-testid="dashboard-link">
                  <User className="text-accent hover:text-primary transition-colors" size={24} />
                </Link>
                <button onClick={handleLogout} data-testid="logout-button">
                  <LogOut className="text-accent hover:text-primary transition-colors" size={24} />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                data-testid="login-link"
                className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary/90 transition-all"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Menu */}
      {menuOpen && (
        <div className="fixed inset-0 top-16 bg-black/20 backdrop-blur-sm z-40" onClick={() => setMenuOpen(false)}>
          <div
            data-testid="sidebar-menu"
            className="absolute left-0 top-0 w-64 h-full bg-white shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-4">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  to={category.path}
                  data-testid={`category-${category.name.toLowerCase()}`}
                  className="block text-lg text-accent hover:text-primary hover:translate-x-2 transition-all"
                  onClick={() => setMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
