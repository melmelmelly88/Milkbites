import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Package, ShoppingBag, Settings, Download, LogOut, Plus, Edit, Trash2, Eye, X, MapPin, Calendar, User, Phone, Upload, Image } from 'lucide-react';
import ProductModal from '../components/ProductModal';
import DiscountModal from '../components/DiscountModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [productDetails, setProductDetails] = useState({});
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [showPaymentProof, setShowPaymentProof] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [siteSettings, setSiteSettings] = useState({
    hero_image: '',
    hero_title: 'Milkbites',
    hero_subtitle: 'by Keka Cakery',
    hero_tagline: 'Premium Baked Goods for Your Celebration',
    hero_badge: 'Eid Special Collection',
    footer_description: 'Premium baked goods crafted with love',
    footer_contact_1: 'Melly: 081294607788',
    footer_contact_2: 'Fari: 081386163292',
    footer_pickup_location: 'Cilandak & Menara Mandiri'
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'orders') {
        const res = await axios.get(`${API}/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } else if (activeTab === 'products') {
        const res = await axios.get(`${API}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(res.data);
      } else if (activeTab === 'discounts') {
        const res = await axios.get(`${API}/admin/discounts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDiscounts(res.data);
      } else if (activeTab === 'settings') {
        const res = await axios.get(`${API}/site-settings`);
        setSiteSettings(res.data);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await axios.put(`${API}/admin/site-settings`, siteSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleHeroImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSiteSettings(prev => ({ ...prev, hero_image: reader.result }));
      toast.success('Image uploaded');
    };
    reader.readAsDataURL(file);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await axios.put(
        `${API}/admin/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Order status updated');
      
      // If status is confirmed, offer to send WhatsApp notification
      if (newStatus === 'confirmed' && response.data.customer_whatsapp) {
        const orderInfo = response.data;
        const message = encodeURIComponent(
          `Hi ${orderInfo.customer_name}!\n\n` +
          `Your order #${orderInfo.order_number} has been CONFIRMED!\n\n` +
          `Total: Rp ${orderInfo.final_amount?.toLocaleString('id-ID')}\n\n` +
          `Thank you for ordering from Milkbites! We'll process your order soon.\n\n` +
          `- Milkbites by Keka Cakery`
        );
        const whatsappUrl = `https://wa.me/${orderInfo.customer_whatsapp.replace(/^0/, '62')}?text=${message}`;
        
        if (window.confirm('Order confirmed! Do you want to notify the customer via WhatsApp?')) {
          window.open(whatsappUrl, '_blank');
        }
      }
      
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleWhatsAppNotify = (order) => {
    const message = encodeURIComponent(
      `Hi ${order.customer_name}!\n\n` +
      `Update for Order #${order.order_number}:\n` +
      `Status: ${order.status.toUpperCase()}\n` +
      `Total: Rp ${order.final_amount?.toLocaleString('id-ID')}\n\n` +
      `Thank you for ordering from Milkbites!\n\n` +
      `- Milkbites by Keka Cakery`
    );
    const whatsappUrl = `https://wa.me/${order.customer_whatsapp?.replace(/^0/, '62')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleViewOrderDetails = async (order) => {
    setSelectedOrder(order);
    
    // Fetch product details for order items
    const productIds = [...new Set(order.items.map(item => item.product_id))];
    const details = {};
    for (const id of productIds) {
      try {
        const prod = await axios.get(`${API}/products/${id}`);
        details[id] = prod.data;
      } catch (err) {
        console.error(`Failed to fetch product ${id}`);
      }
    }
    setProductDetails(details);
  };

  const handleDownloadCSV = async () => {
    try {
      const response = await axios.get(`${API}/admin/orders/export/csv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('CSV downloaded successfully');
    } catch (error) {
      toast.error('Failed to download CSV');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`${API}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Product deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        // Update existing product
        await axios.put(
          `${API}/products/${editingProduct.id}`,
          productData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Product updated successfully');
      } else {
        // Create new product
        await axios.post(
          `${API}/products`,
          productData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Product added successfully');
      }
      setShowProductModal(false);
      setEditingProduct(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleSaveDiscount = async (discountData) => {
    try {
      if (editingDiscount) {
        // Update existing discount
        await axios.put(
          `${API}/admin/discounts/${editingDiscount.id}`,
          discountData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Discount updated successfully');
      } else {
        // Create new discount
        await axios.post(
          `${API}/admin/discounts`,
          discountData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Discount added successfully');
      }
      setShowDiscountModal(false);
      setEditingDiscount(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to save discount');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-accent">Admin Dashboard - Milkbites</h1>
            <button
              data-testid="admin-logout-button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-accent hover:text-primary transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-8 inline-flex gap-2 flex-wrap">
          <button
            data-testid="admin-orders-tab"
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'orders' ? 'bg-primary text-white' : 'text-accent hover:bg-secondary/50'
            }`}
          >
            <Package className="inline-block w-5 h-5 mr-2" />
            Orders
          </button>
          <button
            data-testid="admin-products-tab"
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'products' ? 'bg-primary text-white' : 'text-accent hover:bg-secondary/50'
            }`}
          >
            <ShoppingBag className="inline-block w-5 h-5 mr-2" />
            Products
          </button>
          <button
            data-testid="admin-discounts-tab"
            onClick={() => setActiveTab('discounts')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'discounts' ? 'bg-primary text-white' : 'text-accent hover:bg-secondary/50'
            }`}
          >
            <Settings className="inline-block w-5 h-5 mr-2" />
            Discounts
          </button>
          <button
            data-testid="admin-settings-tab"
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'settings' ? 'bg-primary text-white' : 'text-accent hover:bg-secondary/50'
            }`}
          >
            <Image className="inline-block w-5 h-5 mr-2" />
            Site Settings
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            {activeTab === 'orders' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-accent">Order List</h2>
                  <button
                    data-testid="download-csv-button"
                    onClick={handleDownloadCSV}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-all"
                  >
                    <Download size={20} />
                    Download CSV
                  </button>
                </div>

                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      data-testid={`admin-order-${order.id}`}
                      className="bg-white rounded-xl p-6 shadow-sm border border-border/50"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-accent">
                            Order #{order.order_number}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div>
                          <select
                            data-testid={`order-status-select-${order.id}`}
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)} border-none cursor-pointer`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-muted-foreground">Customer:</span>
                          <span className="font-medium ml-2">{order.customer_name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">WhatsApp:</span>
                          <span className="font-medium ml-2">{order.customer_whatsapp}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-bold text-primary ml-2">
                            Rp {order.final_amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium ml-2 capitalize">{order.delivery_type}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-3 flex-wrap">
                        {order.customer_whatsapp && (
                          <button
                            onClick={() => handleWhatsAppNotify(order)}
                            data-testid={`whatsapp-notify-${order.id}`}
                            className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 text-sm font-medium transition-colors"
                          >
                            <Phone size={14} />
                            WhatsApp
                          </button>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <button
                          onClick={() => handleViewOrderDetails(order)}
                          data-testid={`view-order-details-${order.id}`}
                          className="flex items-center gap-2 bg-sky-100 text-sky-700 px-4 py-2 rounded-lg hover:bg-sky-200 text-sm font-medium transition-colors"
                        >
                          <Eye size={16} />
                          View Order Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-accent">Product Management</h2>
                  <button
                    data-testid="add-product-button"
                    onClick={() => {
                      setEditingProduct(null);
                      setShowProductModal(true);
                    }}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-all"
                  >
                    <Plus size={20} />
                    Add Product
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      data-testid={`admin-product-${product.id}`}
                      className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden"
                    >
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-accent mb-2">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {product.description}
                        </p>
                        <p className="text-xl font-bold text-primary mb-4">
                          Rp {product.price.toLocaleString('id-ID')}
                        </p>
                        <div className="flex gap-2">
                          <button
                            data-testid={`edit-product-${product.id}`}
                            onClick={() => {
                              setEditingProduct(product);
                              setShowProductModal(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                          <button
                            data-testid={`delete-product-${product.id}`}
                            onClick={() => handleDeleteProduct(product.id)}
                            className="flex items-center justify-center bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'discounts' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-accent">Discounts & Promos</h2>
                  <button
                    data-testid="add-discount-button"
                    onClick={() => {
                      setEditingDiscount(null);
                      setShowDiscountModal(true);
                    }}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-all"
                  >
                    <Plus size={20} />
                    Add Discount
                  </button>
                </div>

                <div className="space-y-4">
                  {discounts.map((discount) => (
                    <div
                      key={discount.id}
                      data-testid={`discount-${discount.id}`}
                      className="bg-white rounded-xl p-6 shadow-sm border border-border/50"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-accent mb-2">
                            Code: {discount.code}
                          </h3>
                          <p className="text-muted-foreground">
                            {discount.discount_type === 'percentage'
                              ? `${discount.discount_value}% off`
                              : `Rp ${discount.discount_value.toLocaleString('id-ID')} off`}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Min. purchase: Rp {discount.min_purchase.toLocaleString('id-ID')}
                          </p>
                          {(discount.valid_from || discount.valid_until) && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Valid: {discount.valid_from || 'Anytime'} - {discount.valid_until || 'Forever'}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-medium ${
                            discount.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {discount.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          data-testid={`edit-discount-${discount.id}`}
                          onClick={() => {
                            setEditingDiscount(discount);
                            setShowDiscountModal(true);
                          }}
                          className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-accent">Site Settings</h2>
                  <button
                    data-testid="save-settings-button"
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {savingSettings ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Hero Section Settings */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50">
                    <h3 className="text-lg font-semibold text-accent mb-4 flex items-center gap-2">
                      <Image size={20} />
                      Hero Section
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-accent mb-2">Hero Image</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={siteSettings.hero_image?.startsWith('data:') ? 'Uploaded Image' : siteSettings.hero_image}
                            onChange={(e) => setSiteSettings(prev => ({ ...prev, hero_image: e.target.value }))}
                            className="flex-1 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            placeholder="Image URL"
                            disabled={siteSettings.hero_image?.startsWith('data:')}
                          />
                          <label className="cursor-pointer bg-sky-100 text-sky-700 px-4 py-2 rounded-lg hover:bg-sky-200 transition-colors">
                            <Upload size={18} />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleHeroImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {siteSettings.hero_image && (
                          <img src={siteSettings.hero_image} alt="Hero Preview" className="mt-2 w-full h-32 object-cover rounded-lg" />
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-accent mb-2">Title</label>
                        <input
                          type="text"
                          value={siteSettings.hero_title}
                          onChange={(e) => setSiteSettings(prev => ({ ...prev, hero_title: e.target.value }))}
                          className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-accent mb-2">Subtitle</label>
                        <input
                          type="text"
                          value={siteSettings.hero_subtitle}
                          onChange={(e) => setSiteSettings(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                          className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-accent mb-2">Tagline</label>
                        <input
                          type="text"
                          value={siteSettings.hero_tagline}
                          onChange={(e) => setSiteSettings(prev => ({ ...prev, hero_tagline: e.target.value }))}
                          className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-accent mb-2">Badge Text</label>
                        <input
                          type="text"
                          value={siteSettings.hero_badge}
                          onChange={(e) => setSiteSettings(prev => ({ ...prev, hero_badge: e.target.value }))}
                          className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Settings */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50">
                    <h3 className="text-lg font-semibold text-accent mb-4">Footer Information</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-accent mb-2">Description</label>
                        <textarea
                          value={siteSettings.footer_description}
                          onChange={(e) => setSiteSettings(prev => ({ ...prev, footer_description: e.target.value }))}
                          className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          rows="2"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-accent mb-2">Contact 1</label>
                        <input
                          type="text"
                          value={siteSettings.footer_contact_1}
                          onChange={(e) => setSiteSettings(prev => ({ ...prev, footer_contact_1: e.target.value }))}
                          className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-accent mb-2">Contact 2</label>
                        <input
                          type="text"
                          value={siteSettings.footer_contact_2}
                          onChange={(e) => setSiteSettings(prev => ({ ...prev, footer_contact_2: e.target.value }))}
                          className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-accent mb-2">Pickup Location</label>
                        <input
                          type="text"
                          value={siteSettings.footer_pickup_location}
                          onChange={(e) => setSiteSettings(prev => ({ ...prev, footer_pickup_location: e.target.value }))}
                          className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        show={showProductModal}
        product={editingProduct}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />

      {/* Discount Modal */}
      <DiscountModal
        show={showDiscountModal}
        discount={editingDiscount}
        onClose={() => {
          setShowDiscountModal(false);
          setEditingDiscount(null);
        }}
        onSave={handleSaveDiscount}
      />

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-accent">
                Order #{selectedOrder.order_number}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Order Status */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-sky-50 rounded-xl p-4">
                <h3 className="font-semibold text-accent mb-3 flex items-center gap-2">
                  <User size={18} />
                  Customer Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedOrder.customer_name || 'N/A'}</span></p>
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-muted-foreground" />
                    <span className="font-medium">{selectedOrder.customer_whatsapp || 'N/A'}</span>
                  </p>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-accent mb-3 flex items-center gap-2">
                  {selectedOrder.delivery_type === 'delivery' ? <MapPin size={18} /> : <Calendar size={18} />}
                  {selectedOrder.delivery_type === 'delivery' ? 'Delivery Address' : 'Pickup Details'}
                </h3>
                {selectedOrder.delivery_type === 'delivery' ? (
                  <p className="text-sm">{selectedOrder.delivery_address || 'No address provided'}</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Location:</span> <span className="font-medium">{selectedOrder.pickup_location || 'N/A'}</span></p>
                    <p><span className="text-muted-foreground">Date:</span> <span className="font-medium">{selectedOrder.pickup_date || 'N/A'}</span></p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-accent mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => {
                    const product = productDetails[item.product_id];
                    return (
                      <div key={index} className="flex gap-4 bg-gray-50 rounded-lg p-3">
                        {product && product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{product?.name || item.product_id}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity} × Rp {item.price.toLocaleString('id-ID')}</p>
                          {item.customization && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.customization.selected_variants && (
                                <p>Variants: {item.customization.selected_variants.join(', ')}</p>
                              )}
                              {item.customization.variants && (
                                <p>Variants: {Array.isArray(item.customization.variants) ? item.customization.variants.join(', ') : item.customization.variants}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="font-semibold text-primary">
                          Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Notes */}
              {selectedOrder.notes && (
                <div className="bg-yellow-50 rounded-xl p-4">
                  <h3 className="font-semibold text-accent mb-2">Notes</h3>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Order Summary */}
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>Rp {selectedOrder.total_amount?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Rp {selectedOrder.shipping_fee?.toLocaleString('id-ID')}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>- Rp {selectedOrder.discount_amount?.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">Rp {selectedOrder.final_amount?.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Payment Proof */}
              {selectedOrder.payment_proof && (
                <div>
                  <h3 className="font-semibold text-accent mb-3">Payment Proof</h3>
                  <img 
                    src={selectedOrder.payment_proof} 
                    alt="Payment Proof" 
                    className="w-full max-h-64 object-contain rounded-lg border border-border cursor-pointer"
                    onClick={() => setShowPaymentProof(selectedOrder.payment_proof)}
                  />
                </div>
              )}

              {/* Order Date */}
              <p className="text-center text-sm text-muted-foreground">
                Ordered on: {new Date(selectedOrder.created_at).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
