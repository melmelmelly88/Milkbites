import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { Package, MapPin, User as UserIcon, Eye, Plus, Edit, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'orders') {
        const ordersRes = await axios.get(`${API}/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(ordersRes.data);
      } else if (activeTab === 'addresses') {
        const addressRes = await axios.get(`${API}/addresses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAddresses(addressRes.data);
      }
      
      if (!user) {
        const userRes = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userRes.data);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Delete this address?')) return;
    
    try {
      await axios.delete(`${API}/addresses/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Address deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleSaveAddress = async (addressData) => {
    try {
      if (editingAddress) {
        // Update existing address
        await axios.put(
          `${API}/addresses/${editingAddress.id}`,
          addressData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Address updated');
      } else {
        // Create new address
        await axios.post(
          `${API}/addresses`,
          addressData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Address saved');
      }
      setShowAddressModal(false);
      setEditingAddress(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to save address');
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddressModal(true);
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

  const getStatusText = (status) => {
    const texts = {
      pending: 'Awaiting Confirmation',
      confirmed: 'Confirmed',
      processing: 'Processing',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return texts[status] || status;
  };

  if (loading && !user) {
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-accent mb-6 md:mb-8">My Account</h1>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 md:mb-8 flex gap-2 overflow-x-auto">
          <button
            data-testid="orders-tab"
            onClick={() => setActiveTab('orders')}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-primary text-white'
                : 'text-accent hover:bg-secondary/50'
            }`}
          >
            <Package className="inline-block w-4 h-4 md:w-5 md:h-5 mr-2" />
            <span className="text-sm md:text-base">My Orders</span>
          </button>
          <button
            data-testid="addresses-tab"
            onClick={() => setActiveTab('addresses')}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'addresses'
                ? 'bg-primary text-white'
                : 'text-accent hover:bg-secondary/50'
            }`}
          >
            <MapPin className="inline-block w-4 h-4 md:w-5 md:h-5 mr-2" />
            <span className="text-sm md:text-base">Addresses</span>
          </button>
          <button
            data-testid="profile-tab"
            onClick={() => setActiveTab('profile')}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-primary text-white'
                : 'text-accent hover:bg-secondary/50'
            }`}
          >
            <UserIcon className="inline-block w-4 h-4 md:w-5 md:h-5 mr-2" />
            <span className="text-sm md:text-base">Profile</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'orders' ? (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl p-8 md:p-12 text-center shadow-sm">
                <Package className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg md:text-xl text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  data-testid={`order-${order.id}`}
                  className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-border/50"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-3">
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold text-accent mb-1">
                        Order #{order.order_number}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <span
                      data-testid={`order-status-${order.id}`}
                      className={`px-3 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-medium ${getStatusColor(order.status)}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Delivery Type</span>
                      <span className="font-medium capitalize">{order.delivery_type}</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Total Payment</span>
                      <span className="font-bold text-primary">
                        Rp {order.final_amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {order.delivery_type === 'pickup' && order.pickup_location && (
                    <div className="text-xs md:text-sm text-muted-foreground mb-4">
                      <MapPin className="inline-block w-3 h-3 md:w-4 md:h-4 mr-1" />
                      Pickup: {order.pickup_location} - {order.pickup_date}
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/order/${order.id}`)}
                    data-testid={`view-order-detail-${order.id}`}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors text-sm md:text-base"
                  >
                    <Eye size={16} />
                    View Order Details
                  </button>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'addresses' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-accent">My Addresses</h2>
              <button
                data-testid="add-address-button"
                onClick={() => {
                  setEditingAddress(null);
                  setShowAddressModal(true);
                }}
                className="flex items-center gap-2 bg-primary text-white px-4 md:px-6 py-2 md:py-3 rounded-full hover:bg-primary/90 transition-all text-sm md:text-base"
              >
                <Plus size={18} />
                Add Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="bg-white rounded-xl p-8 md:p-12 text-center shadow-sm">
                <MapPin className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg md:text-xl text-muted-foreground mb-4">No addresses saved</p>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary/90 transition-all text-sm md:text-base"
                >
                  Add Your First Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    data-testid={`address-${address.id}`}
                    className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-border/50"
                  >
                    {address.is_default && (
                      <span className="inline-block bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-3">
                        Default Address
                      </span>
                    )}
                    <p className="text-sm md:text-base text-accent font-medium mb-2">{address.full_address}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">{address.city}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mb-4">{address.postal_code}</p>
                    
                    <div className="flex gap-2">
                      <button
                        data-testid={`delete-address-${address.id}`}
                        onClick={() => handleDeleteAddress(address.id)}
                        className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-sm"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl md:text-2xl font-semibold text-accent mb-4 md:mb-6">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs md:text-sm text-muted-foreground">Full Name</label>
                <p className="text-base md:text-lg font-medium text-accent">{user?.full_name}</p>
              </div>
              <div>
                <label className="text-xs md:text-sm text-muted-foreground">Email</label>
                <p className="text-base md:text-lg font-medium text-accent">{user?.email}</p>
              </div>
              <div>
                <label className="text-xs md:text-sm text-muted-foreground">WhatsApp</label>
                <p className="text-base md:text-lg font-medium text-accent">{user?.whatsapp}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <AddressModal
          show={showAddressModal}
          address={editingAddress}
          onClose={() => {
            setShowAddressModal(false);
            setEditingAddress(null);
          }}
          onSave={handleSaveAddress}
        />
      )}
    </div>
  );
};

// Address Modal Component
const AddressModal = ({ show, address, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    full_address: '',
    city: '',
    postal_code: '',
    is_default: false
  });

  useEffect(() => {
    if (address) {
      setFormData({
        full_address: address.full_address || '',
        city: address.city || '',
        postal_code: address.postal_code || '',
        is_default: address.is_default || false
      });
    }
  }, [address]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border p-4 md:p-6 flex justify-between items-center">
          <h2 className="text-xl md:text-2xl font-bold text-accent">
            {address ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              Full Address *
            </label>
            <textarea
              data-testid="address-input"
              value={formData.full_address}
              onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
              rows="3"
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
              placeholder="Street address, building, apartment"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              City *
            </label>
            <input
              data-testid="city-input"
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
              placeholder="Jakarta"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              Postal Code *
            </label>
            <input
              data-testid="postal-code-input"
              type="text"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
              placeholder="12345"
              required
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                data-testid="default-address-checkbox"
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-5 h-5 text-primary border-input rounded focus:ring-2 focus:ring-primary"
              />
              <span className="ml-2 text-sm font-medium text-accent">Set as default address</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-border rounded-full hover:bg-secondary/50 transition-colors font-medium text-sm md:text-base"
            >
              Cancel
            </button>
            <button
              data-testid="save-address-button"
              type="submit"
              className="flex-1 bg-primary text-white px-4 py-3 rounded-full hover:bg-primary/90 transition-all font-medium text-sm md:text-base"
            >
              Save Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerDashboard;
