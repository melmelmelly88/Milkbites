import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, LogOut, ChevronRight } from 'lucide-react';

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
    { name: 'Cookies', path: '/?category=Cookies', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&q=80' },
    { name: 'Babka', path: '/?category=Babka', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80' },
    { name: 'Cake', path: '/?category=Cake', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&q=80' },
    { name: 'Hampers', path: '/?category=Hampers', image: 'https://images.unsplash.com/photo-1607478900766-efe13248b125?w=300&q=80' }
  ];

  const quickLinks = [
    { name: 'Shop All', path: '/' },
    { name: 'About Us', path: '/' },
    { name: 'Contact', path: '/' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Burger Menu Button */}
          <button
            data-testid="burger-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors z-50"
          >
            {menuOpen ? (
              <X size={24} className="text-accent" />
            ) : (
              <Menu size={24} className="text-accent" />
            )}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
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

      {/* Full Screen Menu Overlay - Milk Bar Style */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-white z-[100]"
          style={{ top: '0' }}
        >
          {/* Header inside menu */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
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
                className="h-12 w-auto object-contain"
              />
            </Link>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>

          <div className="h-full overflow-y-auto pb-20">
            <div className="max-w-lg mx-auto px-4 py-6">
              {/* Quick Links */}
              <nav className="mb-8">
                {quickLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between py-4 border-b border-gray-100 text-lg font-semibold text-gray-900 hover:text-sky-600 transition-colors"
                  >
                    <span>{link.name}</span>
                    <ChevronRight size={20} className="text-gray-400" />
                  </Link>
                ))}
              </nav>

              {/* Category Grid with Images */}
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Shop by Category</h3>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {categories.map((category) => (
                  <Link
                    key={category.name}
                    to={category.path}
                    data-testid={`menu-category-${category.name.toLowerCase()}`}
                    onClick={() => setMenuOpen(false)}
                    className="relative group overflow-hidden rounded-xl aspect-square"
                  >
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <span className="text-white font-bold text-base uppercase tracking-wide">
                        {category.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* User Actions */}
              {token ? (
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <User size={20} />
                    <span className="font-medium">My Account</span>
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <ShoppingCart size={20} />
                    <span className="font-medium">My Cart</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 py-3 px-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Sign Out</span>
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
        </div>
      )}
    </header>
  );
};

export default Header;
