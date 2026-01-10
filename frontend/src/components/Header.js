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
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Burger Menu */}
          <button
            data-testid="burger-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            {menuOpen ? <X size={20} className="text-accent md:w-6 md:h-6" /> : <Menu size={20} className="text-accent md:w-6 md:h-6" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold text-accent">Milkbites</h1>
          </Link>

          {/* Right Icons */}
          <div className="flex items-center gap-2 md:gap-4">
            {token ? (
              <>
                <Link to="/cart" data-testid="cart-link">
                  <ShoppingCart className="text-accent hover:text-primary transition-colors" size={20} />
                </Link>
                <Link to="/dashboard" data-testid="dashboard-link">
                  <User className="text-accent hover:text-primary transition-colors" size={20} />
                </Link>
                <button onClick={handleLogout} data-testid="logout-button" className="hidden md:block">
                  <LogOut className="text-accent hover:text-primary transition-colors" size={20} />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                data-testid="login-link"
                className="bg-primary text-white px-4 md:px-6 py-1.5 md:py-2 rounded-full hover:bg-primary/90 transition-all text-sm md:text-base"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Menu */}
      {menuOpen && (
        <div className="fixed inset-0 top-14 md:top-16 bg-black/40 backdrop-blur-sm z-40" onClick={() => setMenuOpen(false)}>
          <div
            data-testid="sidebar-menu"
            className="absolute left-0 top-0 w-72 h-full bg-white shadow-2xl border-r border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-accent mb-6 pb-3 border-b border-border">Product Categories</h3>
              <nav className="space-y-2">
                {categories.map((category) => (
                  <Link
                    key={category.name}
                    to={category.path}
                    data-testid={`category-${category.name.toLowerCase()}`}
                    className="block px-4 py-3 text-accent hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium border border-transparent hover:border-primary/20"
                    onClick={() => setMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))}
              </nav>
              
              {token && (
                <div className="mt-6 pt-6 border-t border-border">
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
