import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, LogOut, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

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
    
    window.addEventListener('cartUpdated', updateGuestCartCount);
    window.addEventListener('storage', updateGuestCartCount);
    
    return () => {
      window.removeEventListener('cartUpdated', updateGuestCartCount);
      window.removeEventListener('storage', updateGuestCartCount);
    };
  }, [token]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleGuestCartClick = () => {
    const guestCart = JSON.parse(localStorage.getItem('guestCart') || '{"items":[]}');
    if (guestCart.items.length > 0) {
      navigate('/login');
    } else {
      navigate('/login');
    }
  };

  const categories = [
    { name: 'Hampers', path: '/?category=Hampers' },
    { name: 'Babka', path: '/?category=Babka' },
    { name: 'Cookies', path: '/?category=Cookies' },
    { name: 'Cake', path: '/?category=Cake' }
  ];

  // Full screen menu component
  const FullScreenMenu = () => {
    if (!menuOpen) return null;
    
    return createPortal(
      <div 
        className="fixed inset-0 bg-white flex flex-col"
        style={{ zIndex: 99999 }}
      >
        {/* Header inside menu */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={24} className="text-gray-700" />
          </button>
          <Link to="/" onClick={() => setMenuOpen(false)}>
            <img 
              src="https://customer-assets.emergentagent.com/job_cake-commerce-4/artifacts/qna9h32i_IMG-4835.PNG" 
              alt="Milkbites" 
              className="h-28 md:h-36 w-auto object-contain"
            />
          </Link>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-lg mx-auto px-4 py-6">
            {/* Categories */}
            <nav className="mb-6">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  to={category.path}
                  data-testid={`menu-category-${category.name.toLowerCase()}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between py-4 border-b border-gray-100 text-lg font-semibold text-gray-900 hover:text-sky-600 transition-colors"
                >
                  <span>{category.name}</span>
                  <ChevronRight size={20} className="text-gray-400" />
                </Link>
              ))}
            </nav>

            {/* User Actions */}
            {token ? (
              <div className="space-y-1 pt-4 border-t border-gray-200">
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between py-4 text-lg font-semibold text-gray-900 hover:text-sky-600 transition-colors"
                >
                  <span>My Account</span>
                  <ChevronRight size={20} className="text-gray-400" />
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between py-4 text-lg font-semibold text-red-600 hover:text-red-700 transition-colors"
                >
                  <span>Logout</span>
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center bg-sky-500 text-white py-3 rounded-full font-semibold hover:bg-sky-600 transition-colors"
                >
                  Login / Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Burger Menu Button */}
            <button
              data-testid="burger-menu-button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <Menu size={24} className="text-accent" />
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
      </header>
      
      {/* Render menu using portal */}
      <FullScreenMenu />
    </>
  );
};

export default Header;
