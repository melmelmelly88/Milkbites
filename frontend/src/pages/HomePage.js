import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchParams] = useSearchParams();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [siteSettings, setSiteSettings] = useState({
    hero_images: [],
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

  // Get hero images array (fallback to single image if no array)
  const heroImages = siteSettings.hero_images?.length > 0 
    ? siteSettings.hero_images 
    : [siteSettings.hero_image];

  // Auto-advance slider
  useEffect(() => {
    if (heroImages.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroImages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [heroImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

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

      {/* Hero Section with Slider */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        {/* Slider Images */}
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`Hero ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        
        {/* Clear overlay with tagline only */}
        <div className="absolute inset-0 bg-black/20 flex items-end justify-center pb-12">
          <div className="text-center text-white px-4">
            <p className="text-base md:text-lg lg:text-xl font-medium drop-shadow-md">{siteSettings.hero_tagline}</p>
          </div>
        </div>

        {/* Slider Navigation */}
        {heroImages.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronLeft size={24} className="text-gray-800" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronRight size={24} className="text-gray-800" />
            </button>
            
            {/* Dots indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
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
              <img 
                src="https://customer-assets.emergentagent.com/job_cake-commerce-4/artifacts/qna9h32i_IMG-4835.PNG" 
                alt="Milkbites by Keka Cakery" 
                className="h-14 w-auto object-contain mb-4 brightness-0 invert"
              />
              <p className="text-white/90">{siteSettings.footer_description}</p>
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
            <p>&copy; 2025 Milkbites by Keka Cakery. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
