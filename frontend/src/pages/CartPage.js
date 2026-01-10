import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);

      // Fetch product details
      const productIds = [...new Set(response.data.items.map((item) => item.product_id))];
      const productDetails = {};
      for (const id of productIds) {
        const prod = await axios.get(`${API}/products/${id}`);
        productDetails[id] = prod.data;
      }
      setProducts(productDetails);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await axios.delete(`${API}/cart/item/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Product removed from cart');
      fetchCart();
    } catch (error) {
      toast.error('Failed to remove product');
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-accent mb-6 md:mb-8">Shopping Cart</h1>

        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <p className="text-lg md:text-xl text-muted-foreground mb-6">Your cart is empty</p>
            <Link
              to="/"
              className="inline-block bg-primary text-white px-6 md:px-8 py-3 rounded-full hover:bg-primary/90 transition-all text-sm md:text-base"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item, index) => {
                const product = products[item.product_id];
                if (!product) return null;

                return (
                  <div
                    key={index}
                    data-testid={`cart-item-${item.product_id}`}
                    className="bg-white rounded-xl p-6 shadow-sm border border-border/50"
                  >
                    <div className="flex gap-4">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-accent mb-2">{product.name}</h3>
                        {item.customization && item.customization.variants && (
                          <p className="text-xs md:text-sm text-muted-foreground mb-2">
                            Variants: {Array.isArray(item.customization.variants) ? item.customization.variants.join(', ') : item.customization.variants}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs md:text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                            <p className="text-base md:text-lg font-bold text-primary mt-1">
                              Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                            </p>
                          </div>
                          <button
                            data-testid={`remove-item-${item.product_id}`}
                            onClick={() => handleRemoveItem(item.product_id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-border/50 sticky top-24">
                <h2 className="text-xl md:text-2xl font-bold text-accent mb-6">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-muted-foreground text-sm md:text-base">
                    <span>Subtotal</span>
                    <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between font-bold text-accent text-lg md:text-xl">
                      <span>Total</span>
                      <span data-testid="cart-total">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <button
                  data-testid="checkout-button"
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-primary text-white py-3 rounded-full hover:bg-primary/90 transition-all font-semibold text-sm md:text-base"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
