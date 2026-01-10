import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { ArrowLeft, Package, MapPin, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(response.data);

      // Fetch product details
      const productIds = [...new Set(response.data.items.map((item) => item.product_id))];
      const productDetails = {};
      for (const id of productIds) {
        try {
          const prod = await axios.get(`${API}/products/${id}`);
          productDetails[id] = prod.data;
        } catch (err) {
          console.error(`Failed to fetch product ${id}`);
        }
      }
      setProducts(productDetails);
    } catch (error) {
      toast.error('Gagal memuat detail pesanan');
      navigate('/dashboard');
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

  if (!order) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-border/50 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-accent mb-2">
                Order #{order.order_number}
              </h1>
              <p className="text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
            >
              {getStatusText(order.status)}
            </span>
          </div>

          {/* Delivery Info */}
          <div className="bg-secondary/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              {order.delivery_type === 'pickup' ? (
                <MapPin className="text-primary mt-1" size={20} />
              ) : (
                <Package className="text-primary mt-1" size={20} />
              )}
              <div>
                <h3 className="font-semibold text-accent mb-1">
                  {order.delivery_type === 'pickup' ? 'Pickup' : 'Delivery'}
                </h3>
                {order.delivery_type === 'pickup' ? (
                  <div>
                    <p className="text-sm text-muted-foreground">{order.pickup_location}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Calendar size={16} />
                      {order.pickup_date}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-accent mb-4">Products</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => {
                const product = products[item.product_id];
                return (
                  <div key={index} className="flex gap-4 p-4 bg-background rounded-lg">
                    {product && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-accent">
                        {product?.name || 'Product'}
                      </h4>
                      {item.customization && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.customization.variants && (
                            <p>Variants: {Array.isArray(item.customization.variants) ? item.customization.variants.join(', ') : item.customization.variants}</p>
                          )}
                          {item.customization.variant_types && (
                            <div>
                              {Object.entries(item.customization.variant_types).map(([type, variants]) => (
                                <p key={type}>{type}: {variants.join(', ')}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Quantity: {item.quantity} × Rp {item.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-accent mb-2">Catatan</h3>
              <p className="text-muted-foreground bg-secondary/20 p-4 rounded-lg">{order.notes}</p>
            </div>
          )}

          {/* Payment Summary */}
          <div className="border-t border-border pt-6">
            <h3 className="text-xl font-semibold text-accent mb-4">Ringkasan Pembayaran</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>Rp {order.total_amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Ongkir</span>
                <span>Rp {order.shipping_fee.toLocaleString('id-ID')}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon</span>
                  <span>- Rp {order.discount_amount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between font-bold text-accent text-xl">
                  <span>Total</span>
                  <span>Rp {order.final_amount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Proof */}
          {order.payment_proof && (
            <div className="mt-6 border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-accent mb-4">Payment Proof</h3>
              <div className="bg-secondary/10 rounded-lg p-4 border border-border">
                <img
                  src={order.payment_proof}
                  alt="Payment Proof"
                  className="w-full max-w-md mx-auto rounded-lg shadow-md"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
