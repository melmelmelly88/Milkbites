import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../components/Header';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CheckoutPage = () => {
  const [cart, setCart] = useState(null);
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState('Cilandak');
  const [pickupDate, setPickupDate] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
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
      
      if (!response.data.items || response.data.items.length === 0) {
        toast.error('Cart is empty');
        navigate('/cart');
      }
    } catch (error) {
      toast.error('Failed to load cart');
    }
  };

  const calculateSubtotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getShippingFee = () => {
    return deliveryType === 'pickup' ? 0 : 25000;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + getShippingFee() - discountAmount;
  };

  const handleApplyDiscount = async () => {
    if (!discountCode) return;

    try {
      const response = await axios.post(
        `${API}/discounts/validate?code=${discountCode}&total=${calculateSubtotal()}`
      );
      setDiscountAmount(response.data.discount_amount);
      toast.success('Discount code applied successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid discount code');
      setDiscountAmount(0);
    }
  };

  const handleSubmitOrder = async () => {
    if (deliveryType === 'delivery' && !deliveryAddress) {
      toast.error('Please enter delivery address');
      return;
    }

    if (deliveryType === 'pickup' && !pickupDate) {
      toast.error('Please select pickup date');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cart.items,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? deliveryAddress : null,
        pickup_location: deliveryType === 'pickup' ? pickupLocation : null,
        pickup_date: deliveryType === 'pickup' ? pickupDate : null,
        discount_code: discountCode || null,
        notes
      };

      const response = await axios.post(`${API}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Order placed successfully');
      navigate(`/payment/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (!cart) {
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
        <h1 className="text-4xl font-bold text-accent mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Type */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50">
              <h2 className="text-xl font-semibold text-accent mb-4">Tipe Pengiriman</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  data-testid="delivery-option"
                  onClick={() => setDeliveryType('delivery')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    deliveryType === 'delivery'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold">Delivery</div>
                  <div className="text-sm mt-1">Rp 25.000</div>
                </button>
                <button
                  data-testid="pickup-option"
                  onClick={() => setDeliveryType('pickup')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    deliveryType === 'pickup'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold">Pick Up</div>
                  <div className="text-sm mt-1">GRATIS</div>
                </button>
              </div>
            </div>

            {/* Delivery Address or Pickup Location */}
            {deliveryType === 'delivery' ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50">
                <h2 className="text-xl font-semibold text-accent mb-4">Alamat Pengiriman</h2>
                <textarea
                  data-testid="delivery-address-input"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows="4"
                  placeholder="Masukkan alamat lengkap (JABODETABEK only)"
                  required
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50">
                <h2 className="text-xl font-semibold text-accent mb-4">Lokasi & Tanggal Pickup</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-accent mb-2">
                      Lokasi Pickup
                    </label>
                    <select
                      data-testid="pickup-location-select"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Cilandak">Cilandak - Jl. Cilandak 1 No. 28</option>
                      <option value="Menara Mandiri">Menara Mandiri (weekday only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-accent mb-2">
                      Tanggal Pickup
                    </label>
                    <input
                      data-testid="pickup-date-input"
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Discount Code */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50">
              <h2 className="text-xl font-semibold text-accent mb-4">Kode Diskon</h2>
              <div className="flex gap-2">
                <input
                  data-testid="discount-code-input"
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Masukkan kode (e.g., EID2025)"
                />
                <button
                  data-testid="apply-discount-button"
                  onClick={handleApplyDiscount}
                  className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  Terapkan
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50">
              <h2 className="text-xl font-semibold text-accent mb-4">Catatan Pesanan</h2>
              <textarea
                data-testid="order-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows="3"
                placeholder="Catatan khusus untuk pesanan Anda (opsional)"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-border/50 sticky top-24">
              <h2 className="text-2xl font-bold text-accent mb-6">Ringkasan Pesanan</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Ongkir</span>
                  <span>Rp {getShippingFee().toLocaleString('id-ID')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon</span>
                    <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between font-bold text-accent text-lg">
                    <span>Total</span>
                    <span data-testid="checkout-total">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <button
                data-testid="submit-order-button"
                onClick={handleSubmitOrder}
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-full hover:bg-primary/90 transition-all disabled:opacity-50 font-semibold"
              >
                {loading ? 'Memproses...' : 'Buat Pesanan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
