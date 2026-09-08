"use client";

export default function CancelOrderButton({ orderId }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    });

    window.location.reload();
  };

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        className="w-full px-4 py-3 bg-red-600/70 text-white rounded-lg hover:bg-red-700/60 cursor-pointer transition-colors"
      >
        Cancel Order
      </button>
    </form>
  );
}
