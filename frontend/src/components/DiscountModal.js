import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

const DiscountModal = ({ show, onClose, discount, onSave }) => {
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase: '',
    valid_from: '',
    valid_until: '',
    active: true
  });

  useEffect(() => {
    if (discount) {
      setFormData({
        code: discount.code || '',
        discount_type: discount.discount_type || 'percentage',
        discount_value: discount.discount_value || '',
        min_purchase: discount.min_purchase || '',
        valid_from: discount.valid_from || '',
        valid_until: discount.valid_until || '',
        active: discount.active !== undefined ? discount.active : true
      });
    } else {
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_purchase: '',
        valid_from: '',
        valid_until: '',
        active: true
      });
    }
  }, [discount, show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.discount_value || !formData.min_purchase) {
      toast.error('Code, discount value, and minimum purchase are required');
      return;
    }

    if (formData.discount_type === 'percentage' && (formData.discount_value < 0 || formData.discount_value > 100)) {
      toast.error('Percentage must be between 0 and 100');
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
            {discount ? 'Edit Discount' : 'Add Discount'}
          </h2>
          <button
            data-testid="close-discount-modal"
            onClick={onClose}
            className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              Discount Code *
            </label>
            <input
              data-testid="discount-code-input"
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary uppercase"
              placeholder="e.g., EID2025"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Discount Type *
              </label>
              <select
                data-testid="discount-type-select"
                name="discount_type"
                value={formData.discount_type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (Rp)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Discount Value *
              </label>
              <input
                data-testid="discount-value-input"
                type="number"
                name="discount_value"
                value={formData.discount_value}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={formData.discount_type === 'percentage' ? '5' : '50000'}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.discount_type === 'percentage' ? '0-100%' : 'Amount in Rupiah'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              Minimum Purchase (Rp) *
            </label>
            <input
              data-testid="discount-min-purchase-input"
              type="number"
              name="min_purchase"
              value={formData.min_purchase}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="1000000"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Valid From
              </label>
              <input
                data-testid="discount-valid-from-input"
                type="date"
                name="valid_from"
                value={formData.valid_from}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Valid Until
              </label>
              <input
                data-testid="discount-valid-until-input"
                type="date"
                name="valid_until"
                value={formData.valid_until}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                data-testid="discount-active-checkbox"
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="w-5 h-5 text-primary border-input rounded focus:ring-2 focus:ring-primary"
              />
              <span className="ml-2 text-sm font-medium text-accent">Active Discount</span>
            </label>
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
              data-testid="save-discount-button"
              type="submit"
              className="flex-1 bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-all font-medium"
            >
              {discount ? 'Update Discount' : 'Add Discount'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiscountModal;
