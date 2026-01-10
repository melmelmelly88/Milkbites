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
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first');
      setTimeout(() => navigate('/login'), 1000);
      return;
    }

    // Validate customization
    if (product.requires_customization && product.customization_options) {
      // Check if product has variant_types (new format)
      if (product.customization_options.variant_types) {
        const variantTypes = product.customization_options.variant_types;
        for (const [typeName, typeConfig] of Object.entries(variantTypes)) {
          const selectedCount = selectedVariantsByType[typeName]?.length || 0;
          if (selectedCount !== typeConfig.required_count) {
            toast.error(`Please select ${typeConfig.required_count} ${typeConfig.label}`);
            return;
          }
        }
      } else {
        // Old format - single variant list
        const requiredCount = product.customization_options.required_count || 1;
        if (selectedVariants.length !== requiredCount) {
          toast.error(`Please select ${requiredCount} variants`);
          return;
        }
      }
    }

    setAdding(true);
    try {
      let customization = null;
      if (product.requires_customization) {
        if (product.customization_options.variant_types) {
          // New format with variant types
          customization = { variant_types: selectedVariantsByType };
        } else {
          // Old format
          customization = { variants: selectedVariants };
        }
      }

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

      toast.success('Product added to cart');
      navigate('/cart');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add to cart');
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
        toast.error(`Maximum ${requiredCount} variants`);
      }
    }
  };

  const handleVariantTypeToggle = (typeName, variant, maxCount) => {
    const currentSelected = selectedVariantsByType[typeName] || [];
    
    if (currentSelected.includes(variant)) {
      // Remove variant
      setSelectedVariantsByType({
        ...selectedVariantsByType,
        [typeName]: currentSelected.filter((v) => v !== variant)
      });
    } else {
      // Add variant
      if (currentSelected.length < maxCount) {
        setSelectedVariantsByType({
          ...selectedVariantsByType,
          [typeName]: [...currentSelected, variant]
        });
      } else {
        toast.error(`Maximum ${maxCount} selections`);
      }
    }
  };

  // Products excluded from Kaastengel additional fee
  const kaastengelExcludedProducts = [
    'Hampers Double Cookies',
    'Hampers Babka & Cookies',
    'Hampers 4 Cookies'
  ];

  const isKaastengelFeeApplicable = () => {
    return product && !kaastengelExcludedProducts.includes(product.name);
  };

  const calculatePrice = () => {
    let price = product.price;
    
    // Only add Kaastengel fee if product is not in excluded list
    if (isKaastengelFeeApplicable()) {
      // Check new format with variant_types
      if (product.customization_options?.variant_types) {
        // Count Kaastengel from cookies type
        const cookiesSelected = selectedVariantsByType['cookies'] || [];
        const kaastengelCount = cookiesSelected.filter((v) => v.includes('Kaastengel')).length;
        price += kaastengelCount * 10000;
      } else if (selectedVariants.length > 0) {
        // Old format
        const kaastengelCount = selectedVariants.filter((v) => v.includes('Kaastengel')).length;
        price += kaastengelCount * 10000;
      }
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
          <p className="text-xl text-muted-foreground">Product not found</p>
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
              {isKaastengelFeeApplicable() && (selectedVariants.some((v) => v.includes('Kaastengel')) || 
                (selectedVariantsByType['cookies'] || []).some((v) => v.includes('Kaastengel'))) && (
                <p className="text-sm text-muted-foreground mt-2">
                  *Includes Kaastengel additional fee (Rp 10,000)
                </p>
              )}
            </div>

            {/* Customization Options */}
            {product.requires_customization && product.customization_options && (
              <div className="mb-6 space-y-6">
                {/* New format with variant_types */}
                {product.customization_options.variant_types ? (
                  Object.entries(product.customization_options.variant_types).map(([typeName, typeConfig]) => {
                    const selectedCount = selectedVariantsByType[typeName]?.length || 0;
                    return (
                      <div key={typeName}>
                        <h3 className="text-xl font-semibold text-accent mb-4">
                          {typeConfig.label} ({selectedCount}/{typeConfig.required_count})
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {typeConfig.variants.map((variant) => {
                            const isSelected = (selectedVariantsByType[typeName] || []).includes(variant);
                            return (
                              <button
                                key={variant}
                                data-testid={`variant-${typeName}-${variant}`}
                                onClick={() => handleVariantTypeToggle(typeName, variant, typeConfig.required_count)}
                                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                                  isSelected
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:border-primary/50'
                                }`}
                              >
                                {variant}
                                {isKaastengelFeeApplicable() && variant.includes('Kaastengel') && (
                                  <span className="text-xs block mt-1">+Rp 10.000</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* Old format with single variant list */
                  <div>
                    <h3 className="text-xl font-semibold text-accent mb-4">
                      Select Variants ({selectedVariants.length}/{product.customization_options.required_count})
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
                          {isKaastengelFeeApplicable() && variant.includes('Kaastengel') && (
                            <span className="text-xs block mt-1">+Rp 10.000</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-accent mb-4">Quantity</h3>
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
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
