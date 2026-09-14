import Link from "next/link";
import {
  getDashboardStats,
  getRevenueByDay,
  getOrdersByPaymentMethod,
  getRecentOrders,
} from "@/lib/adminStats";
import RevenueChart from "@/components/admin/RevenueChart";
import PaymentMethodChart from "@/components/admin/PaymentMethodChart";

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
    getRecentOrders(10).catch(() => []),
  ]);

  const formatCurrency = (amount) => `Rs. ${amount.toLocaleString("en-PK")}`;
  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending_confirmation: "bg-yellow-900/50 text-yellow-400",
      confirmed: "bg-blue-900/50 text-blue-400",
      shipped: "bg-purple-900/50 text-purple-400",
      delivered: "bg-green-900/50 text-green-400",
      cancelled: "bg-red-900/50 text-red-400",
    };
    return statusMap[status] || "bg-gray-900/50 text-gray-400";
  };
  const formatStatus = (status) =>
    status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const cardStyle = {
    backgroundColor: "var(--admin-surface)",
    border: "1px solid var(--admin-border)",
  };
  const labelStyle = { color: "var(--admin-text-muted)" };

  return (
    <div
      className="grid grid-cols-2 gap-4 p-4 md:grid-cols-6 md:gap-6 md:p-8"
      style={{ backgroundColor: "var(--admin-bg)" }}
    >
      <div
        className="order-1 col-span-1 min-w-0 rounded-2xl p-6 md:order-1 md:col-span-2"
        style={cardStyle}
      >
        <div
          className="text-4xl font-bebas"
          style={{ color: "var(--admin-accent)" }}
        >
          {stats.totalOrdersToday}
        </div>
        <div
          className="mt-2 text-[11px] uppercase tracking-[2px]"
          style={labelStyle}
        >
          Today's Orders
        </div>
      </div>

      <div
        className="order-2 col-span-1 min-w-0 rounded-2xl p-6 md:order-3 md:col-span-2"
        style={cardStyle}
      >
        <div
          className="text-4xl font-bebas"
          style={{ color: "var(--admin-accent)" }}
        >
          {stats.pendingOrders}
        </div>
        <div
          className="mt-2 text-[11px] uppercase tracking-[2px]"
          style={labelStyle}
        >
          Pending Orders
        </div>
      </div>

      <div
        className="order-3 col-span-2 min-w-0 rounded-2xl p-6 md:order-2 md:col-span-2"
        style={cardStyle}
      >
        <div
          className="text-4xl font-bebas"
          style={{ color: "var(--admin-accent)" }}
        >
          {formatCurrency(stats.revenueThisMonth)}
        </div>
        <div
          className="mt-2 text-[11px] uppercase tracking-[2px]"
          style={labelStyle}
        >
          Monthly Revenue
        </div>
      </div>

      <div
        className="order-4 col-span-2 min-w-0 rounded-2xl p-6 md:order-4 md:col-span-3"
        style={cardStyle}
      >
        <h3
          className="mb-4 text-[11px] uppercase tracking-[2px]"
          style={labelStyle}
        >
          Revenue — Last 7 Days
        </h3>
        <RevenueChart data={revenueData} />
      </div>

      <div
        className="order-5 col-span-2 min-w-0 rounded-2xl p-6 md:order-5 md:col-span-3"
        style={cardStyle}
      >
        <h3
          className="mb-4 text-[11px] uppercase tracking-[2px]"
          style={labelStyle}
        >
          Orders by Payment Method
        </h3>
        <PaymentMethodChart data={paymentData} />
      </div>

      <div
        className="order-6 col-span-2 min-w-0 rounded-2xl p-6 md:order-6 md:col-span-6"
        style={cardStyle}
      >
        <h3
          className="mb-4 text-[11px] uppercase tracking-[2px]"
          style={labelStyle}
        >
          Recent Orders
        </h3>
        <div className="w-full overflow-x-auto">
          <table className="min-w-[640px] w-full [&_th:nth-child(odd)]:bg-white [&_td:nth-child(odd)]:bg-white [&_th:nth-child(even)]:bg-[#F3F5F7] [&_td:nth-child(even)]:bg-[#F3F5F7] md:min-w-0 md:[&_th]:bg-transparent md:[&_td]:bg-transparent">
            <thead>
              <tr style={{ backgroundColor: "var(--admin-surface-low)" }}>
                {[
                  "Order ID",
                  "Customer",
                  "Amount",
                  "Payment",
                  "Status",
                  "Date",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-3 py-2 text-left text-[11px] uppercase tracking-[2px] md:px-4 md:py-3"
                    style={labelStyle}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="py-8 text-center"
                    style={labelStyle}
                  >
                    No orders yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-t"
                    style={{ borderColor: "var(--admin-surface-low)" }}
                  >
                    <td
                      className="px-3 py-2 font-mono text-xs md:px-4 md:py-4 md:text-sm"
                      style={{ color: "var(--admin-accent)" }}
                    >
                      {order.orderId}
                    </td>
                    <td className="px-3 py-2 text-xs md:px-4 md:py-4 md:text-sm">
                      <div style={{ color: "var(--admin-text)" }}>
                        {order.customer.name}
                      </div>
                      <span
                        className="block max-w-[140px] truncate md:max-w-none"
                        style={labelStyle}
                      >
                        {order.customer.email}
                      </span>
                    </td>
                    <td
                      className="px-3 py-2 text-xs md:px-4 md:py-4 md:text-sm"
                      style={{ color: "var(--admin-text)" }}
                    >
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td
                      className="px-3 py-2 text-xs capitalize md:px-4 md:py-4 md:text-sm"
                      style={{ color: "var(--admin-text)" }}
                    >
                      {order.paymentMethod.replace(/_/g, " ")}
                    </td>
                    <td className="px-3 py-2 text-xs md:px-4 md:py-4 md:text-sm">
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${getStatusBadgeClass(order.orderStatus)}`}
                      >
                        {formatStatus(order.orderStatus)}
                      </span>
                    </td>
                    <td
                      className="px-3 py-2 text-xs md:px-4 md:py-4 md:text-sm"
                      style={{ color: "var(--admin-text)" }}
                    >
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-xs md:px-4 md:py-4 md:text-sm">
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="text-sm hover:underline"
                        style={{ color: "var(--admin-accent)" }}
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
