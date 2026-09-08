'use client';

import { useState } from 'react';

const STATUS_OPTIONS = [
  { value: 'pending_confirmation', label: 'Pending Confirmation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

export default function OrderStatusUpdater({ orderId, initialStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setMessage('Status updated');
        setTimeout(() => setMessage(''), 2000);
      } else {
        setMessage('Failed to update status');
      }
    } catch (error) {
      setMessage('Error updating status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        disabled={saving}
        className="w-full px-4 py-3 rounded-lg focus:outline-none disabled:opacity-50"
        style={{ backgroundColor: 'var(--admin-surface-low)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', colorScheme: 'dark' }}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-4 py-3 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: 'var(--admin-accent)', color: '#fff' }}
      >
        {saving ? 'Saving...' : 'Save Status'}
      </button>

      {message && (
        <div className={`text-sm text-center ${message.includes('updated') ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
