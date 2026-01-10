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

  const categories = ['Cookies', 'Babka', 'Cake', 'Hampers'];

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
  }, [activeCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = activeCategory === 'All' ? `${API}/products` : `${API}/products?category=${activeCategory}`;
      const response = await axios.get(url);
      setProducts(response.data);
      
      // Select 6 random products for featured section
      if (activeCategory === 'All') {
        const shuffled = [...response.data].sort(() => 0.5 - Math.random());
        setFeaturedProducts(shuffled.slice(0, 6));
      } else {
        setFeaturedProducts([]);
      }
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
      <div className="relative h-[50vh] overflow-hidden\">
        <img
          src="https://images.unsplash.com/photo-1760448199008-6078bc23bfaa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwY29va2llcyUyMGFlc3RoZXRpY3xlbnwwfHx8fDE3NjgwMjkxMDB8MA&ixlib=rb-4.1.0&q=85"
          alt="Milkbites Bakery"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Milkbites</h1>
            <p className="text-lg md:text-xl">Premium Baked Goods for Your Celebration</p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-3 flex gap-2 overflow-x-auto\">\n          {categories.map((category) => (
            <button
              key={category}
              data-testid={`tab-${category.toLowerCase()}`}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeCategory === category
                  ? 'bg-primary text-white shadow-md'
                  : 'text-accent hover:bg-secondary/50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            {activeCategory === 'All' ? (
              // Featured Products Section
              <>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-accent">
                    Featured Products
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {featuredProducts.length > 0 && (
                  <div className="text-center mt-12">
                    <Link
                      to="/products"
                      data-testid="view-all-products-link"
                      className="inline-block bg-primary text-white px-8 py-3 rounded-full hover:bg-primary/90 transition-all font-semibold"
                    >
                      View All Products
                    </Link>
                  </div>
                )}
              </>
            ) : (
              // Category Products Section
              <>
                <h2 className="text-3xl md:text-4xl font-bold text-accent mb-8">
                  {activeCategory}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {products.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="text-xl">No products in this category yet</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-accent text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Milkbites</h3>
              <p className="text-white/80">Premium baked goods crafted with love</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <p className="text-white/80">Melly: 081294607788</p>
              <p className="text-white/80">Fari: 081386163292</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Pickup Location</h4>
              <p className="text-white/80">Cilandak & Menara Mandiri</p>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60">
            <p>&copy; 2025 Milkbites. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
