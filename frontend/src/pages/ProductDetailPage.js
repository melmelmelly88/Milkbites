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
    
    // Build customization object
    let customization = null;
    if (product.requires_customization) {
      if (product.customization_options.variant_types) {
        customization = { variant_types: selectedVariantsByType };
      } else {
        customization = { variants: selectedVariants };
      }
    }

    if (token) {
      // User is logged in - add to server cart
      try {
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
      }
    } else {
      // Guest user - add to localStorage cart
      try {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '{"items":[]}');
        
        // Check if same product with same customization exists
        const customizationKey = JSON.stringify(customization);
        const existingItemIndex = guestCart.items.findIndex(item => 
          item.product_id === product.id && 
          JSON.stringify(item.customization) === customizationKey
        );
        
        if (existingItemIndex >= 0) {
          guestCart.items[existingItemIndex].quantity += quantity;
        } else {
          guestCart.items.push({
            product_id: product.id,
            quantity,
            price: calculatePrice() / quantity, // Base price per unit
            customization
          });
        }
        
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        toast.success('Product added to cart! Login to checkout.');
        
        // Dispatch event for header cart count update
        window.dispatchEvent(new Event('cartUpdated'));
        
        navigate('/');
      } catch (error) {
        toast.error('Failed to add to cart');
      }
    }
    
    setAdding(false);
  };

  const handleVariantToggle = (variant) => {
    const requiredCount = product.customization_options?.required_count || 1;
    // Get variant name (handle both string and object format)
    const variantName = typeof variant === 'object' ? variant.name : variant;
    
    if (selectedVariants.includes(variantName)) {
      setSelectedVariants(selectedVariants.filter((v) => v !== variantName));
    } else {
      if (selectedVariants.length < requiredCount) {
        setSelectedVariants([...selectedVariants, variantName]);
      } else {
        toast.error(`Maximum ${requiredCount} variants`);
      }
    }
  };

  const handleVariantTypeToggle = (typeName, variant, maxCount) => {
    const currentSelected = selectedVariantsByType[typeName] || [];
    // Get variant name (handle both string and object format)
    const variantName = typeof variant === 'object' ? variant.name : variant;
    
    if (currentSelected.includes(variantName)) {
      // Remove variant
      setSelectedVariantsByType({
        ...selectedVariantsByType,
        [typeName]: currentSelected.filter((v) => v !== variantName)
      });
    } else {
      // Add variant
      if (currentSelected.length < maxCount) {
        setSelectedVariantsByType({
          ...selectedVariantsByType,
          [typeName]: [...currentSelected, variantName]
        });
      } else {
        toast.error(`Maximum ${maxCount} selections`);
      }
    }
  };

  // Get additional price for a variant
  const getVariantAdditionalPrice = (variant) => {
    if (typeof variant === 'object' && variant.additional_price !== undefined) {
      return variant.additional_price;
    }
    return 0;
  };

  // Get variant name
  const getVariantName = (variant) => {
    return typeof variant === 'object' ? variant.name : variant;
  };

  const calculatePrice = () => {
    let price = product.price;
    
    // Calculate additional prices from variant_types format
    if (product.customization_options?.variant_types) {
      Object.entries(product.customization_options.variant_types).forEach(([typeName, typeConfig]) => {
        const selectedNames = selectedVariantsByType[typeName] || [];
        selectedNames.forEach(selectedName => {
          const variant = typeConfig.variants.find(v => getVariantName(v) === selectedName);
          if (variant) {
            price += getVariantAdditionalPrice(variant);
          }
        });
      });
    } else if (product.customization_options?.variants) {
      // Old format - check for additional prices
      selectedVariants.forEach(selectedName => {
        const variant = product.customization_options.variants.find(v => getVariantName(v) === selectedName);
        if (variant) {
          price += getVariantAdditionalPrice(variant);
        }
      });
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
                            const variantName = getVariantName(variant);
                            const additionalPrice = getVariantAdditionalPrice(variant);
                            const isSelected = (selectedVariantsByType[typeName] || []).includes(variantName);
                            return (
                              <button
                                key={variantName}
                                data-testid={`variant-${typeName}-${variantName}`}
                                onClick={() => handleVariantTypeToggle(typeName, variant, typeConfig.required_count)}
                                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                                  isSelected
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:border-primary/50'
                                }`}
                              >
                                {variantName}
                                {additionalPrice > 0 && (
                                  <span className="text-xs block mt-1 text-orange-600">+Rp {additionalPrice.toLocaleString('id-ID')}</span>
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
                      {product.customization_options.variants.map((variant) => {
                        const variantName = getVariantName(variant);
                        const additionalPrice = getVariantAdditionalPrice(variant);
                        const isSelected = selectedVariants.includes(variantName);
                        return (
                          <button
                            key={variantName}
                            data-testid={`variant-${variantName}`}
                            onClick={() => handleVariantToggle(variant)}
                            className={`px-4 py-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            {variantName}
                            {additionalPrice > 0 && (
                              <span className="text-xs block mt-1 text-orange-600">+Rp {additionalPrice.toLocaleString('id-ID')}</span>
                            )}
                          </button>
                        );
                      })}
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
