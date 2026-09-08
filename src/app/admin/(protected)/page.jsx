import Link from 'next/link';
import { getDashboardStats, getRevenueByDay, getOrdersByPaymentMethod, getRecentOrders } from '@/lib/adminStats';
import RevenueChart from '@/components/admin/RevenueChart';
import PaymentMethodChart from '@/components/admin/PaymentMethodChart';

export default async function AdminDashboard() {
  const [stats, revenueData, paymentData, recentOrders] = await Promise.all([
    getDashboardStats().catch(() => ({
      totalOrdersToday: 0,
      totalOrdersThisWeek: 0,
      totalOrdersThisMonth: 0,
      revenueToday: 0,
      revenueThisWeek: 0,
      revenueThisMonth: 0,
      pendingOrders: 0,
    })),
    getRevenueByDay(7).catch(() => []),
    getOrdersByPaymentMethod().catch(() => []),
    getRecentOrders(10).catch(() => [])
  ]);

  const formatCurrency = (amount) => {
    return `Rs. ${amount.toLocaleString('en-PK')}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending_confirmation: 'bg-yellow-900/50 text-yellow-400',
      confirmed: 'bg-blue-900/50 text-blue-400',
      shipped: 'bg-purple-900/50 text-purple-400',
      delivered: 'bg-green-900/50 text-green-400',
      cancelled: 'bg-red-900/50 text-red-400'
    };
    return statusMap[status] || 'bg-gray-900/50 text-gray-400';
  };

  const formatStatus = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-8 space-y-8" style={{ backgroundColor: 'var(--admin-bg)' }}>
      {/* Row 1 - Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
          <div className="text-4xl font-bebas" style={{ color: 'var(--admin-accent)' }}>{stats.totalOrdersToday}</div>
          <div className="text-[11px] uppercase tracking-[2px] mt-2" style={{ color: 'var(--admin-text-muted)' }}>Today's Orders</div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
          <div className="text-4xl font-bebas" style={{ color: 'var(--admin-accent)' }}>{formatCurrency(stats.revenueThisMonth)}</div>
          <div className="text-[11px] uppercase tracking-[2px] mt-2" style={{ color: 'var(--admin-text-muted)' }}>Monthly Revenue</div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
          <div className="text-4xl font-bebas" style={{ color: 'var(--admin-accent)' }}>{stats.pendingOrders}</div>
          <div className="text-[11px] uppercase tracking-[2px] mt-2" style={{ color: 'var(--admin-text-muted)' }}>Pending Orders</div>
        </div>
      </div>

      {/* Row 2 - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
          <h3 className="text-[11px] uppercase tracking-[2px] mb-4" style={{ color: 'var(--admin-text-muted)' }}>Revenue — Last 7 Days</h3>
          <RevenueChart data={revenueData} />
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
          <h3 className="text-[11px] uppercase tracking-[2px] mb-4" style={{ color: 'var(--admin-text-muted)' }}>Orders by Payment Method</h3>
          <PaymentMethodChart data={paymentData} />
        </div>
      </div>

      {/* Row 3 - Recent Orders Table */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
        <h3 className="text-[11px] uppercase tracking-[2px] mb-4" style={{ color: 'var(--admin-text-muted)' }}>Recent Orders</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="" style={{ backgroundColor: 'var(--admin-surface-low)' }}>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>Order ID</th>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>Customer</th>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>Amount</th>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>Payment</th>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>Status</th>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>Date</th>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8" style={{ color: 'var(--admin-text-muted)' }}>No orders yet.</td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order._id} className="border-t" style={{ borderColor: 'var(--admin-surface-low)' }}>
                    <td className="px-4 py-4 font-mono text-sm" style={{ color: 'var(--admin-accent)' }}>
                      {order.orderId}
                    </td>
                    <td className="px-4 py-4">
                      <div style={{ color: 'var(--admin-text)' }}>{order.customer.name}</div>
                      <div className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>{order.customer.email}</div>
                    </td>
                    <td className="px-4 py-4" style={{ color: 'var(--admin-text)' }}>{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-4 capitalize" style={{ color: 'var(--admin-text)' }}>{order.paymentMethod.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadgeClass(order.orderStatus)}`}>
                        {formatStatus(order.orderStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-4" style={{ color: 'var(--admin-text)' }}>{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="text-sm hover:underline"
                        style={{ color: 'var(--admin-accent)' }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
