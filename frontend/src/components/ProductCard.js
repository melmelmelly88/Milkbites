import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ShoppingCart, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductCard = ({ product }) => {
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // If product requires customization, redirect to product page
    if (product.requires_customization) {
      navigate(`/product/${product.id}`);
      return;
    }

    setAdding(true);
    
    if (token) {
      // User is logged in - add to server cart
      try {
        await axios.post(
          `${API}/cart/add`,
          {
            product_id: product.id,
            quantity: 1,
            customization: null
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        toast.success('Added to cart!');
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to add to cart');
      }
    } else {
      // Guest user - add to localStorage cart
      try {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '{"items":[]}');
        const existingItem = guestCart.items.find(item => item.product_id === product.id);
        
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          guestCart.items.push({
            product_id: product.id,
            quantity: 1,
            price: product.price,
            customization: null
          });
        }
        
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        toast.success('Added to cart!');
        
        // Dispatch event for header cart count update
        window.dispatchEvent(new Event('cartUpdated'));
      } catch (error) {
        toast.error('Failed to add to cart');
      }
    }
    
    setAdding(false);
  };

  return (
    <div
      data-testid={`product-card-${product.id}`}
      className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-sky-100 hover:border-sky-300"
    >
      <Link to={`/product/${product.id}`}>
        <div className="aspect-square overflow-hidden relative">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.requires_customization && (
            <div className="absolute top-2 right-2 bg-sky-500 text-white text-xs px-2 py-1 rounded-full">
              Customizable
            </div>
          )}
        </div>
        <div className="p-4 bg-gradient-to-b from-white to-sky-50/50">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
          <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg md:text-xl font-bold text-sky-600">
              Rp {product.price.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </Link>
      
      {/* Quick Add Button */}
      <div className="px-4 pb-4">
        <button
          data-testid={`quick-add-${product.id}`}
          onClick={handleQuickAdd}
          disabled={adding}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            product.requires_customization
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-sky-500 text-white hover:bg-sky-600'
          } disabled:opacity-50`}
        >
          {adding ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ShoppingCart size={16} />
          )}
          {product.requires_customization ? 'Select Options' : 'Quick Add'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
