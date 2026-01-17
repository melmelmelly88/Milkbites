import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { Upload, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState({});
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchOrder();
    fetchSiteSettings();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(response.data);
      if (response.data.payment_proof) {
        setUploaded(true);
      }
      
      // Fetch product details for items
      const productIds = [...new Set(response.data.items.map(item => item.product_id))];
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
      toast.error('Failed to load order');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const response = await axios.get(`${API}/site-settings`);
      setSiteSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch site settings');
    }
  };

  const generateWhatsAppMessage = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Build product list
    let productList = '';
    if (order && order.items) {
      order.items.forEach((item, index) => {
        const product = products[item.product_id];
        const productName = product?.name || item.product_id;
        let itemLine = `${index + 1}. ${productName} x${item.quantity}`;
        
        // Add customization info
        if (item.customization) {
          if (item.customization.variants && Array.isArray(item.customization.variants)) {
            itemLine += ` (${item.customization.variants.join(', ')})`;
          }
          if (item.customization.variant_types) {
            const variants = Object.entries(item.customization.variant_types)
              .map(([type, values]) => `${type}: ${Array.isArray(values) ? values.join(', ') : values}`)
              .join('; ');
            itemLine += ` (${variants})`;
          }
        }
        
        itemLine += ` - Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`;
        productList += itemLine + '\n';
      });
    }
    
    // Payment type info
    const paymentTypeText = order?.payment_type === 'dp50' ? 'Down Payment 50%' : 'Full Payment';
    const paymentAmount = order?.payment_amount || order?.final_amount || 0;
    
    // Delivery info
    const deliveryInfo = order?.delivery_type === 'pickup' 
      ? `Pickup at: ${order.pickup_location}\nPickup Date: ${order.pickup_date}`
      : `Delivery Address: ${order.delivery_address}\nDelivery Date: ${order.pickup_date}`;
    
    const message = `🛒 *New Order from Milkbites*

*Customer:* ${user.full_name}
*WhatsApp:* ${user.whatsapp}
*Order #:* ${order?.order_number}

*Products:*
${productList}
*Subtotal:* Rp ${order?.total_amount?.toLocaleString('id-ID')}
${order?.discount_amount > 0 ? `*Discount:* -Rp ${order?.discount_amount?.toLocaleString('id-ID')}\n` : ''}*Total:* Rp ${order?.final_amount?.toLocaleString('id-ID')}

*Payment Option:* ${paymentTypeText}
*Amount to Pay:* Rp ${paymentAmount.toLocaleString('id-ID')}
${order?.payment_type === 'dp50' ? `*Remaining:* Rp ${(order?.final_amount - paymentAmount).toLocaleString('id-ID')}\n` : ''}
*Delivery Type:* ${order?.delivery_type === 'pickup' ? 'Pick Up' : 'Delivery'}
${deliveryInfo}

${order?.notes ? `*Notes:* ${order.notes}\n` : ''}
✅ Payment proof has been uploaded.`;

    return message;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('File format must be JPG, PNG, or WEBP');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Maximum file size is 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await axios.post(`${API}/orders/${orderId}/payment-proof`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploaded(true);
      toast.success('Payment proof uploaded successfully');
      
      // Send WhatsApp notification with order details
      const whatsappNumber = siteSettings?.whatsapp_number || '6281294607788';
      const message = generateWhatsAppMessage();
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
      
    } catch (error) {
      toast.error('Failed to upload payment proof');
    } finally {
      setUploading(false);
    }
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

  if (!order) {
    return null;
  }

  const paymentAmount = order.payment_amount || order.final_amount;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        <div className="text-center mb-8">
          {uploaded ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl md:text-4xl font-bold text-accent mb-2">Order Successful!</h1>
              <p className="text-base md:text-lg text-muted-foreground">
                Thank you for your order. We will process it shortly.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl md:text-4xl font-bold text-accent mb-2">Payment Instructions</h1>
              <p className="text-base md:text-lg text-muted-foreground">
                Order #{order.order_number}
              </p>
            </>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-border/50 mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-accent mb-4">Order Details</h2>
          
          {/* Products List */}
          <div className="space-y-3 mb-4">
            {order.items.map((item, index) => {
              const product = products[item.product_id];
              return (
                <div key={index} className="flex justify-between items-start text-sm">
                  <div className="flex-1">
                    <span className="font-medium">{product?.name || item.product_id}</span>
                    <span className="text-muted-foreground"> x{item.quantity}</span>
                    {item.customization && item.customization.variants && (
                      <p className="text-xs text-muted-foreground">
                        ({Array.isArray(item.customization.variants) ? item.customization.variants.join(', ') : item.customization.variants})
                      </p>
                    )}
                  </div>
                  <span className="font-medium">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
              );
            })}
          </div>
          
          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">Rp {order.total_amount.toLocaleString('id-ID')}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-green-600 text-sm">
                <span>Discount</span>
                <span className="font-semibold">- Rp {order.discount_amount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-accent">
              <span>Total</span>
              <span>Rp {order.final_amount.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Payment Type Info */}
        <div className="bg-sky-50 rounded-xl p-4 md:p-6 border border-sky-200 mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-accent mb-4">Payment Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Option</span>
              <span className="font-semibold">
                {order.payment_type === 'dp50' ? 'Down Payment 50%' : 'Full Payment'}
              </span>
            </div>
            <div className="flex justify-between font-bold text-xl text-primary">
              <span>Amount to Pay</span>
              <span data-testid="total-payment">Rp {paymentAmount.toLocaleString('id-ID')}</span>
            </div>
            {order.payment_type === 'dp50' && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Remaining (pay before delivery/pickup)</span>
                <span>Rp {(order.final_amount - paymentAmount).toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-border/50 mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-accent mb-4">Bank Transfer</h2>
          <div className="space-y-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="font-medium text-accent mb-2">Bank Mandiri</p>
              <p className="text-lg font-bold text-primary">1310006839957</p>
              <p className="text-sm text-muted-foreground">a.n. Melly Wihera Yulinda</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="font-medium text-accent mb-2">Bank BCA</p>
              <p className="text-lg font-bold text-primary">0354252917</p>
              <p className="text-sm text-muted-foreground">a.n. Melly Wihera Yulinda</p>
            </div>
          </div>
        </div>

        {/* Upload Payment Proof */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-border/50">
          <h2 className="text-xl md:text-2xl font-semibold text-accent mb-4">Upload Payment Proof</h2>
          
          {uploaded ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg text-accent mb-4">Payment proof has been uploaded</p>
              <button
                data-testid="view-order-button"
                onClick={() => navigate('/dashboard')}
                className="bg-primary text-white px-8 py-3 rounded-full hover:bg-primary/90 transition-all"
              >
                View My Orders
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <label
                data-testid="upload-payment-proof-label"
                className="cursor-pointer inline-block"
              >
                <input
                  data-testid="payment-proof-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="border-2 border-dashed border-primary rounded-xl p-8 md:p-12 hover:bg-primary/5 transition-colors">
                  <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-base md:text-lg text-accent font-semibold mb-2">
                    {uploading ? 'Uploading...' : 'Click to upload transfer receipt'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Format: JPG, PNG, WEBP (Max 5MB)
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
