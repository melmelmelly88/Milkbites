import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AllProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const navigate = useNavigate();

  const categories = ['All', 'Cookies', 'Babka', 'Cake', 'Hampers'];

  useEffect(() => {
    fetchProducts();
  }, [activeCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = activeCategory === 'All' ? `${API}/products` : `${API}/products?category=${activeCategory}`;
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>

        <h1 className="text-4xl font-bold text-accent mb-8">All Products</h1>

        {/* Category Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-3 mb-8 flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              data-testid={`filter-${category.toLowerCase()}`}
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

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-muted-foreground">
              Showing {products.length} {activeCategory === 'All' ? 'products' : `${activeCategory.toLowerCase()} products`}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {products.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-xl">No products found in this category</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllProductsPage;
