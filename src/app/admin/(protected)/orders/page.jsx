"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { MessageCircle } from "lucide-react";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Pending Confirmation", value: "pending_confirmation" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (search) params.append("search", search);
      if (activeStatus !== "all") params.append("status", activeStatus);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();

      if (res.ok) {
        setOrders(data.orders);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
      } else {
        setError(data.error || "Failed to fetch orders");
      }
    } catch (err) {
      setError("An error occurred while fetching orders");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, activeStatus, dateFrom, dateTo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 400);

    return () => clearTimeout(timer);
  }, [fetchOrders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeStatus, dateFrom, dateTo]);

  const handleStatusChange = async (orderId, newStatus) => {
    console.log("orderId:", orderId, "type:", typeof orderId);
    setUpdatingOrderId(orderId);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrders(
          orders.map((order) =>
            order._id === orderId
              ? { ...order, orderStatus: newStatus }
              : order,
          ),
        );
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      alert("Error updating status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatCurrency = (amount) => `Rs. ${amount.toLocaleString("en-PK")}`;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPaymentMethod = (method) => {
    return method.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getPaymentStatusBadge = (status) => {
    const styles = {
      paid: "bg-green-900/50 text-green-400",
      pending: "bg-yellow-900/50 text-yellow-400",
      failed: "bg-red-900/50 text-red-400",
      refunded: "bg-blue-900/50 text-blue-400",
    };
    return styles[status] || "bg-gray-900/50 text-gray-400";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-bebas" style={{ color: 'var(--admin-accent)' }}>Orders</h1>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <input
          type="text"
          placeholder="Search by Order ID, name, phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 rounded-lg placeholder-gray-500 focus:outline-none"
          style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
        />

        <div className="flex gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-3 rounded-lg focus:outline-none"
            style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-3 rounded-lg focus:outline-none"
            style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveStatus(tab.value)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeStatus === tab.value
                ? 'font-semibold'
                : ''
            }`}
            style={{
              backgroundColor: activeStatus === tab.value ? 'var(--admin-accent)' : 'transparent',
              color: activeStatus === tab.value ? '#fff' : 'var(--admin-text-muted)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>
        Showing {orders.length} of {totalCount} orders
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--admin-text-muted)' }}>Loading...</div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--admin-accent)', color: '#fff' }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg" style={{ backgroundColor: 'var(--admin-surface)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--admin-surface-low)' }}>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>
                  Order ID
                </th>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>
                  Customer Name
                </th>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>
                  Phone
                </th>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>
                  Items
                </th>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>
                  Total
                </th>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>
                  Payment Method
                </th>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>
                  Payment Status
                </th>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>
                  Order Status
                </th>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>
                  Date
                </th>
                <th className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left" style={{ color: 'var(--admin-text-muted)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-8" style={{ color: 'var(--admin-text-muted)' }}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="border-t" style={{ borderColor: 'var(--admin-surface-low)' }}>
                    <td className="px-4 py-4 font-mono text-sm" style={{ color: 'var(--admin-accent)' }}>
                      {order.orderId}
                    </td>
                    <td className="px-4 py-4" style={{ color: 'var(--admin-text)' }}>
                      {order.customer.name}
                    </td>
                    <td className="px-4 py-4" style={{ color: 'var(--admin-text)' }}>
                      {order.customer.phone}
                    </td>
                    <td className="px-4 py-4" style={{ color: 'var(--admin-text)' }}>
                      {order.items.length} items
                    </td>
                    <td className="px-4 py-4" style={{ color: 'var(--admin-text)' }}>
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-4 py-4" style={{ color: 'var(--admin-text)' }}>
                      {formatPaymentMethod(order.paymentMethod)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${getPaymentStatusBadge(order.paymentStatus)}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={order.orderStatus}
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value)
                        }
                        disabled={updatingOrderId === order._id}
                        className="px-3 py-2 rounded text-sm focus:outline-none disabled:opacity-50"
                        style={{ backgroundColor: 'var(--admin-surface-low)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                      >
                        <option value="pending_confirmation">
                          Pending Confirmation
                        </option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-4" style={{ color: 'var(--admin-text)' }}>
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="px-3 py-1 rounded text-sm"
                          style={{ backgroundColor: 'var(--admin-surface)', color: 'var(--admin-accent)' }}
                        >
                          View
                        </Link>
                        <a
                          href={buildWhatsAppLink({
                            phone: order.customer.whatsappNumber,
                            orderId: order.orderId,
                            customerName: order.customer.name,
                            status: order.orderStatus,
                            items: order.items,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <MessageCircle size={16} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--admin-surface)', color: 'var(--admin-text)' }}
          >
            Previous
          </button>
          <span style={{ color: 'var(--admin-text)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--admin-surface)', color: 'var(--admin-text)' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
