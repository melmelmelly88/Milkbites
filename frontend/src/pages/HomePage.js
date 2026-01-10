import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { useSearchParams, Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchParams] = useSearchParams();
  const [siteSettings, setSiteSettings] = useState({
    hero_image: 'https://images.unsplash.com/photo-1760448199008-6078bc23bfaa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwY29va2llcyUyMGFlc3RoZXRpY3xlbnwwfHx8fDE3NjgwMjkxMDB8MA&ixlib=rb-4.1.0&q=85',
    hero_title: 'Milkbites',
    hero_subtitle: 'by Keka Cakery',
    hero_tagline: 'Premium Baked Goods for Your Celebration',
    hero_badge: 'Eid Special Collection',
    footer_description: 'Premium baked goods crafted with love',
    footer_contact_1: 'Melly: 081294607788',
    footer_contact_2: 'Fari: 081386163292',
    footer_pickup_location: 'Cilandak & Menara Mandiri'
  });

  const categories = ['Cookies', 'Babka', 'Cake', 'Hampers'];

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setActiveCategory(categoryParam);
    } else {
      setActiveCategory('Featured'); // Default to Featured view
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
    fetchFeaturedProducts();
  }, [activeCategory]);

  const fetchSiteSettings = async () => {
    try {
      const response = await axios.get(`${API}/site-settings`);
      setSiteSettings(response.data);
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get(`${API}/products/featured`);
      setFeaturedProducts(response.data);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = (activeCategory === 'Featured' || !activeCategory) 
        ? `${API}/products` 
        : `${API}/products?category=${activeCategory}`;
      const response = await axios.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <img
          src={siteSettings.hero_image}
          alt="Milkbites Bakery"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-600/80 to-blue-700/70 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-3 drop-shadow-lg">
              {siteSettings.hero_title}
            </h1>
            <p className="text-sm md:text-base text-white/90 mb-2 md:mb-3">{siteSettings.hero_subtitle}</p>
            <p className="text-base md:text-lg lg:text-xl font-medium drop-shadow-md">{siteSettings.hero_tagline}</p>
            <p className="text-xs md:text-sm text-white/90 mt-2">{siteSettings.hero_badge}</p>
          </div>
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-sky-300/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-400/30 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
              Milkbites
            </h1>
            <p className="text-sm md:text-base text-white/90 mb-2 md:mb-3">by Keka Cakery</p>
            <p className="text-base md:text-lg lg:text-xl font-medium drop-shadow-md">Premium Baked Goods for Your Celebration</p>
            <p className="text-xs md:text-sm text-white/90 mt-2">Eid Special Collection</p>
          </div>
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-sky-300/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-400/30 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Category Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="bg-white rounded-2xl shadow-lg p-2 md:p-3 flex gap-2 overflow-x-auto border border-sky-100">
          {categories.map((category) => (
            <button
              key={category}
              data-testid={`tab-${category.toLowerCase()}`}
              onClick={() => setActiveCategory(category)}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold whitespace-nowrap transition-all text-sm md:text-base ${
                activeCategory === category
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-sky-50 hover:shadow-sm'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            {activeCategory === 'Featured' || !activeCategory ? (
              // Featured Products Section
              <>
                <div className="flex justify-between items-center mb-6 md:mb-8">
                  <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                      Featured Products
                    </h2>
                    <p className="text-sm md:text-base text-gray-600">Handpicked for you</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {featuredProducts.length > 0 && (
                  <div className="text-center mt-8 md:mt-12">
                    <Link
                      to="/products"
                      data-testid="view-all-products-link"
                      className="inline-block bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-full hover:shadow-lg transition-all font-semibold text-sm md:text-base shadow-md"
                    >
                      View All Products
                    </Link>
                  </div>
                )}
              </>
            ) : (
              // Category Products Section
              <>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 md:mb-8">
                  {activeCategory}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {products.length === 0 && (
                  <div className="text-center py-12 md:py-16 text-muted-foreground">
                    <p className="text-lg md:text-xl">No products in this category yet</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-blue-900 text-white py-12 mt-20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-2">{siteSettings.hero_title}</h3>
              <p className="text-sm text-white/80 mb-3">{siteSettings.hero_subtitle}</p>
              <p className="text-white/90">{siteSettings.footer_description}</p>
              <p className="text-sky-300 mt-2 text-sm">{siteSettings.hero_badge}</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-sky-300">Contact</h4>
              <p className="text-white/90">{siteSettings.footer_contact_1}</p>
              <p className="text-white/90">{siteSettings.footer_contact_2}</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-sky-300">Pickup Location</h4>
              <p className="text-white/90">{siteSettings.footer_pickup_location}</p>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/80">
            <p>&copy; 2025 {siteSettings.hero_title}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
