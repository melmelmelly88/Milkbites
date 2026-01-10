import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { Package, MapPin, User as UserIcon } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, userRes] = await Promise.all([
        axios.get(`${API}/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setOrders(ordersRes.data);
      setUser(userRes.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
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
      pending: 'Menunggu Konfirmasi',
      confirmed: 'Dikonfirmasi',
      processing: 'Diproses',
      completed: 'Selesai',
      cancelled: 'Dibatalkan'
    };
    return texts[status] || status;
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
        <h1 className="text-4xl font-bold text-accent mb-8">Dashboard Saya</h1>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-8 inline-flex gap-2">
          <button
            data-testid="orders-tab"
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'orders'
                ? 'bg-primary text-white'
                : 'text-accent hover:bg-secondary/50'
            }`}
          >
            <Package className="inline-block w-5 h-5 mr-2" />
            Pesanan Saya
          </button>
          <button
            data-testid="profile-tab"
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-primary text-white'
                : 'text-accent hover:bg-secondary/50'
            }`}
          >
            <UserIcon className="inline-block w-5 h-5 mr-2" />
            Profil
          </button>
        </div>

        {/* Content */}
        {activeTab === 'orders' ? (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl text-muted-foreground">Belum ada pesanan</p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  data-testid={`order-${order.id}`}
                  className="bg-white rounded-xl p-6 shadow-sm border border-border/50"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-accent mb-1">
                        Order #{order.order_number}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <span
                      data-testid={`order-status-${order.id}`}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tipe Pengiriman</span>
                      <span className="font-medium capitalize">{order.delivery_type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Pembayaran</span>
                      <span className="font-bold text-primary">
                        Rp {order.final_amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {order.delivery_type === 'pickup' && order.pickup_location && (
                    <div className="text-sm text-muted-foreground">
                      <MapPin className="inline-block w-4 h-4 mr-1" />
                      Pickup: {order.pickup_location} - {order.pickup_date}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-accent mb-6">Informasi Profil</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Nama Lengkap</label>
                <p className="text-lg font-medium text-accent">{user?.full_name}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="text-lg font-medium text-accent">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">WhatsApp</label>
                <p className="text-lg font-medium text-accent">{user?.whatsapp}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
