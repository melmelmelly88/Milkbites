import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, LogOut } from 'lucide-react';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [guestCartCount, setGuestCartCount] = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Calculate guest cart count
  useEffect(() => {
    const updateGuestCartCount = () => {
      if (!token) {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '{"items":[]}');
        const count = guestCart.items.reduce((sum, item) => sum + item.quantity, 0);
        setGuestCartCount(count);
      }
    };

    updateGuestCartCount();
    
    // Listen for cart updates
    window.addEventListener('cartUpdated', updateGuestCartCount);
    window.addEventListener('storage', updateGuestCartCount);
    
    return () => {
      window.removeEventListener('cartUpdated', updateGuestCartCount);
      window.removeEventListener('storage', updateGuestCartCount);
    };
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleGuestCartClick = () => {
    // Show guest cart or redirect to login
    const guestCart = JSON.parse(localStorage.getItem('guestCart') || '{"items":[]}');
    if (guestCart.items.length > 0) {
      navigate('/login');
    } else {
      navigate('/login');
    }
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
            <img 
              src="https://customer-assets.emergentagent.com/job_cake-commerce-4/artifacts/qna9h32i_IMG-4835.PNG" 
              alt="Milkbites by Keka Cakery" 
              className="h-28 md:h-36 w-auto object-contain"
            />
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
              <>
                {/* Guest Cart Icon */}
                <button 
                  onClick={handleGuestCartClick} 
                  data-testid="guest-cart-button"
                  className="relative"
                >
                  <ShoppingCart className="text-accent hover:text-primary transition-colors" size={20} />
                  {guestCartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-sky-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {guestCartCount > 9 ? '9+' : guestCartCount}
                    </span>
                  )}
                </button>
                <Link
                  to="/login"
                  data-testid="login-link"
                  className="bg-primary text-white px-4 md:px-6 py-1.5 md:py-2 rounded-full hover:bg-primary/90 transition-all text-sm md:text-base"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Menu */}
      {menuOpen && (
        <div className="fixed inset-0 top-14 md:top-16 bg-white z-40" onClick={() => setMenuOpen(false)}>
          <div
            data-testid="sidebar-menu"
            className="absolute left-0 top-0 w-56 md:w-64 h-full bg-white shadow-2xl border-r border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 uppercase tracking-wide">Categories</h3>
              <nav className="space-y-1">
                {categories.map((category) => (
                  <Link
                    key={category.name}
                    to={category.path}
                    data-testid={`category-${category.name.toLowerCase()}`}
                    className="block px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-sky-50 hover:text-sky-600 rounded-lg transition-all"
                    onClick={() => setMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))}
              </nav>
              
              {token && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <LogOut size={16} />
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
