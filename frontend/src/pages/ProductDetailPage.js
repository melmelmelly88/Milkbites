import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { Plus, Minus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [selectedVariantsByType, setSelectedVariantsByType] = useState({});
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Produk tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Silakan login terlebih dahulu');
      setTimeout(() => navigate('/login'), 1000);
      return;
    }

    // Validate customization
    if (product.requires_customization && product.customization_options) {
      const requiredCount = product.customization_options.required_count || 1;
      if (selectedVariants.length !== requiredCount) {
        toast.error(`Pilih ${requiredCount} varian`);
        return;
      }
    }

    setAdding(true);
    try {
      const customization = product.requires_customization
        ? { variants: selectedVariants }
        : null;

      await axios.post(
        `${API}/cart/add`,
        {
          product_id: product.id,
          quantity,
          customization
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Produk ditambahkan ke keranjang');
      navigate('/cart');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan ke keranjang');
    } finally {
      setAdding(false);
    }
  };

  const handleVariantToggle = (variant) => {
    const requiredCount = product.customization_options?.required_count || 1;
    
    if (selectedVariants.includes(variant)) {
      setSelectedVariants(selectedVariants.filter((v) => v !== variant));
    } else {
      if (selectedVariants.length < requiredCount) {
        setSelectedVariants([...selectedVariants, variant]);
      } else {
        toast.error(`Maksimal ${requiredCount} varian`);
      }
    }
  };

  const calculatePrice = () => {
    let price = product.price;
    if (selectedVariants.length > 0) {
      const kaastengelCount = selectedVariants.filter((v) => v.includes('Kaastengel')).length;
      price += kaastengelCount * 10000;
    }
    return price * quantity;
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground">Produk tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-4xl font-bold text-accent mb-4">{product.name}</h1>
            <p className="text-lg text-muted-foreground mb-6">{product.description}</p>
            
            <div className="mb-6">
              <span className="text-3xl font-bold text-primary">
                Rp {calculatePrice().toLocaleString('id-ID')}
              </span>
              {selectedVariants.some((v) => v.includes('Kaastengel')) && (
                <p className="text-sm text-muted-foreground mt-2">
                  *Termasuk biaya tambahan Kaastengel (Rp 10.000)
                </p>
              )}
            </div>

            {/* Customization Options */}
            {product.requires_customization && product.customization_options && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-accent mb-4">
                  Pilih Varian ({selectedVariants.length}/{product.customization_options.required_count})
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {product.customization_options.variants.map((variant) => (
                    <button
                      key={variant}
                      data-testid={`variant-${variant}`}
                      onClick={() => handleVariantToggle(variant)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        selectedVariants.includes(variant)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {variant}
                      {variant.includes('Kaastengel') && (
                        <span className="text-xs block mt-1">+Rp 10.000</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-accent mb-4">Jumlah</h3>
              <div className="flex items-center gap-4">
                <button
                  data-testid="decrease-quantity"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 rounded-lg border border-border hover:bg-secondary/50"
                >
                  <Minus size={20} />
                </button>
                <span data-testid="quantity-display" className="text-2xl font-semibold w-12 text-center">{quantity}</span>
                <button
                  data-testid="increase-quantity"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 rounded-lg border border-border hover:bg-secondary/50"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              data-testid="add-to-cart-button"
              onClick={handleAddToCart}
              disabled={adding}
              className="w-full bg-primary text-white py-4 rounded-full hover:bg-primary/90 transition-all disabled:opacity-50 font-semibold text-lg"
            >
              {adding ? 'Menambahkan...' : 'Tambah ke Keranjang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
