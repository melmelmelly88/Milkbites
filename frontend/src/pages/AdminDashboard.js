import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Package, ShoppingBag, Settings, Download, LogOut, Plus, Edit, Trash2, Eye } from 'lucide-react';
import ProductModal from '../components/ProductModal';
import DiscountModal from '../components/DiscountModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [showPaymentProof, setShowPaymentProof] = useState(null);
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
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${API}/admin/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
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
        <div className="bg-white rounded-xl shadow-sm p-2 mb-8 inline-flex gap-2">
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
            Discounts & Promos
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

                      {order.payment_proof && (
                        <div className="mt-4 flex items-center gap-3">
                          <button
                            onClick={() => setShowPaymentProof(order.payment_proof)}
                            data-testid={`view-payment-proof-${order.id}`}
                            className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                          >
                            <Eye size={16} />
                            View Payment Proof
                          </button>
                        </div>
                      )}
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

      {/* Payment Proof Modal */}
      {showPaymentProof && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPaymentProof(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowPaymentProof(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-lg font-bold"
            >
              Close ✕
            </button>
            <img
              src={showPaymentProof}
              alt="Payment Proof"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
