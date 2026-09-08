"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stockStatus, setStockStatus] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (stockStatus !== "all") params.append("stockStatus", stockStatus);

      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();

      if (res.ok) {
        setProducts(data.products);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
      } else {
        setError(data.error || "Failed to fetch products");
      }
    } catch (err) {
      setError("An error occurred while fetching products");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, category, stockStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 400);

    return () => clearTimeout(timer);
  }, [fetchProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, stockStatus]);

  async function handleToggleActive(productId, currentStatus) {
    setTogglingId(productId);

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        setProducts(
          products.map((p) =>
            p._id === productId ? { ...p, isActive: !currentStatus } : p,
          ),
        );
        toast.success(
          `Product ${currentStatus ? "deactivated" : "activated"} successfully`,
        );
      } else {
        toast.error(
          `${currentStatus ? "Deactivate" : "Activate"} product failed. Consult your brother for the solution.`,
        );
      }
    } catch (error) {
      toast.error(
        `${currentStatus ? "Deactivate" : "Activate"} product failed. Consult your brother for the solution.`,
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(productId) {
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts(products.filter((p) => p._id !== productId));
        setDeletingId(null);
        toast.success("Product deleted successfully");
      } else {
        toast.error(
          "Delete product failed. Consult your brother for the solution.",
        );
      }
    } catch (error) {
      toast.error(
        "Delete product failed. Consult your brother for the solution.",
      );
    }
  }

  function formatPrice(price) {
    return `PKR ${price.toLocaleString("en-PK")}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1
          className="text-5xl font-bebas"
          style={{ color: "var(--admin-accent)" }}
        >
          Products
        </h1>
        <button
          onClick={() => router.push("/admin/products/new")}
          className="px-6 py-3 font-bold rounded-lg transition-colors"
          style={{ backgroundColor: "var(--admin-accent)", color: "#fff" }}
        >
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-3 rounded-lg placeholder-gray-500 focus:outline-none"
          style={{
            backgroundColor: "var(--admin-surface-low)",
            border: "1px solid var(--admin-border)",
            color: "var(--admin-text)",
          }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-3 rounded-lg focus:outline-none"
          style={{
            backgroundColor: "var(--admin-surface-low)",
            border: "1px solid var(--admin-border)",
            color: "var(--admin-text)",
          }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={stockStatus}
          onChange={(e) => setStockStatus(e.target.value)}
          className="px-4 py-3 rounded-lg focus:outline-none"
          style={{
            backgroundColor: "var(--admin-surface-low)",
            border: "1px solid var(--admin-border)",
            color: "var(--admin-text)",
          }}
        >
          <option value="all">All</option>
          <option value="inStock">In Stock</option>
          <option value="outOfStock">Out of Stock</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
        Showing {products.length} of {totalCount} products
      </div>

      {/* Products Table */}
      {loading ? (
        <div
          className="text-center py-12"
          style={{ color: "var(--admin-text-muted)" }}
        >
          Loading...
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--admin-accent)", color: "#fff" }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: "var(--admin-surface)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "var(--admin-surface-low)" }}>
                  <th
                    className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    Image
                  </th>
                  <th
                    className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    Name
                  </th>
                  <th
                    className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    Category
                  </th>
                  <th
                    className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    Base Price
                  </th>
                  <th
                    className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    Status
                  </th>
                  <th
                    className="text-[11px] uppercase tracking-[2px] px-4 py-3 text-left"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-8"
                      style={{ color: "var(--admin-text-muted)" }}
                    >
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product._id}
                      className="border-t"
                      style={{ borderColor: "var(--admin-border)" }}
                    >
                      <td className="px-4 py-4">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={
                              typeof product.images[0] === "string"
                                ? product.images[0]
                                : product.images[0].url
                            }
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded"
                            style={{ backgroundColor: "var(--admin-border)" }}
                          />
                        )}
                      </td>
                      <td
                        className="px-4 py-4"
                        style={{ color: "var(--admin-text)" }}
                      >
                        {product.name}
                      </td>
                      <td
                        className="px-4 py-4"
                        style={{ color: "var(--admin-text)" }}
                      >
                        {product.category?.name || product.category || "N/A"}
                      </td>
                      <td
                        className="px-4 py-4"
                        style={{ color: "var(--admin-text)" }}
                      >
                        {formatPrice(product.basePrice)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            product.isActive
                              ? "bg-green-600/70 text-white"
                              : "bg-red-600/70 text-white"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {deletingId === product._id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-3 py-1 rounded text-sm"
                              style={{
                                backgroundColor: "var(--admin-surface)",
                                border: "1px solid var(--admin-border)",
                                color: "var(--admin-text)",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                router.push(
                                  `/admin/products/${product._id}/edit`,
                                )
                              }
                              className="px-3 py-1 rounded text-sm"
                              style={{
                                backgroundColor: "var(--admin-surface)",
                                border: "1px solid var(--admin-border)",
                                color: "var(--admin-text)",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleToggleActive(
                                  product._id,
                                  product.isActive,
                                )
                              }
                              disabled={togglingId === product._id}
                              className="px-3 py-1 rounded text-sm disabled:opacity-50"
                              style={{
                                backgroundColor: "var(--admin-surface)",
                                border: "1px solid var(--admin-border)",
                                color: "var(--admin-text)",
                              }}
                            >
                              {togglingId === product._id
                                ? "..."
                                : product.isActive
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>
                            <button
                              onClick={() => setDeletingId(product._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
              color: "var(--admin-text)",
            }}
          >
            Previous
          </button>
          <span style={{ color: "var(--admin-text)" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
              color: "var(--admin-text)",
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
