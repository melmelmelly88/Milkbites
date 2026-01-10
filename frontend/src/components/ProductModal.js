import React, { useState, useEffect } from 'react';
import { X, Upload, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductModal = ({ show, onClose, product, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Cookies',
    image_url: '',
    stock: 100,
    active: true
  });
  const [imageMode, setImageMode] = useState('url'); // 'url' or 'upload'
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        category: product.category || 'Cookies',
        image_url: product.image_url || '',
        stock: product.stock || 100,
        active: product.active !== undefined ? product.active : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'Cookies',
        image_url: '',
        stock: 100,
        active: true
      });
    }
    setImageMode('url');
  }, [product, show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPG, PNG, WEBP, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image_url: reader.result
        }));
        setUploading(false);
        toast.success('Image uploaded successfully');
      };
      reader.onerror = () => {
        toast.error('Failed to read image');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload image');
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.image_url) {
      toast.error('Name, price, and image are required');
      return;
    }

    await onSave(formData);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-accent">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            data-testid="close-product-modal"
            onClick={onClose}
            className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              Product Name *
            </label>
            <input
              data-testid="product-name-input"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Dutch Kaastengel"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              Description *
            </label>
            <textarea
              data-testid="product-description-input"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Product description..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Price (Rp) *
              </label>
              <input
                data-testid="product-price-input"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="79000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Category *
              </label>
              <select
                data-testid="product-category-select"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Cookies">Cookies</option>
                <option value="Babka">Babka</option>
                <option value="Cake">Cake</option>
                <option value="Hampers">Hampers</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              Image URL *
            </label>
            <input
              data-testid="product-image-input"
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://example.com/image.jpg"
              required
            />
            {formData.image_url && (
              <div className="mt-2">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-border"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    toast.error('Invalid image URL');
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Stock
              </label>
              <input
                data-testid="product-stock-input"
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="100"
              />
            </div>

            <div className="flex items-center pt-8">
              <label className="flex items-center cursor-pointer">
                <input
                  data-testid="product-active-checkbox"
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary border-input rounded focus:ring-2 focus:ring-primary"
                />
                <span className="ml-2 text-sm font-medium text-accent">Product Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-border rounded-full hover:bg-secondary/50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              data-testid="save-product-button"
              type="submit"
              className="flex-1 bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-all font-medium"
            >
              {product ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
