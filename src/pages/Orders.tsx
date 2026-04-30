import React, { useState, useEffect } from "react";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import axios from "axios";
import {
  orderService,
  Order,
  OrderStatus,
  ShippingAddress,
} from "../services/api";
import { cn } from "../lib/utils";

export const Orders = () => {
  type ToastType = "success" | "error";
  type ToastItem = {
    id: string;
    type: ToastType;
    message: string;
    open: boolean;
  };

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const toast: ToastItem = { id, type, message, open: true };
    setToasts((prev) => [toast, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, open: false } : t)),
      );
      window.setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        220,
      );
    }, 3500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, open: false } : t)),
    );
    window.setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      220,
    );
  };

  const getBackendErrorMessage = (err: unknown) => {
    if (!axios.isAxiosError(err))
      return "Something went wrong. Please try again.";
    const data: any = err.response?.data;
    const msg =
      data?.error?.message ||
      data?.message ||
      err.message ||
      "Something went wrong. Please try again.";
    const details = Array.isArray(data?.error?.details)
      ? data.error.details.filter((d: any) => typeof d === "string" && d.trim())
      : [];
    return details.length ? `${msg} (${details.join("; ")})` : msg;
  };

  const Toast: React.FC<{
    toast: ToastItem;
    onClose: (id: string) => void;
  }> = ({ toast, onClose }) => {
    const dot = toast.type === "success" ? "bg-indigo-500" : "bg-rose-500";
    return (
      <div
        className={`pointer-events-auto rounded-lg border ${toast.type === "success" ? "border-indigo-200 bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/40" : "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/40"} shadow-sm overflow-hidden`}
      >
        <div className="flex items-start gap-3 px-4 py-3">
          <div className={`mt-1.5 h-2.5 w-2.5 rounded-full ${dot}`} />
          <div className="flex-1">
            <div className="text-sm font-semibold">
              {toast.type === "success" ? "Success" : "Error"}
            </div>
            <div className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
              {toast.message}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose(toast.id)}
            className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  const ToastContainer: React.FC<{
    toasts: ToastItem[];
    onClose: (id: string) => void;
  }> = ({ toasts, onClose }) => (
    <div className="pointer-events-none fixed right-4 top-4 z-9999 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [detailOrders, setDetailOrders] = useState<Record<string, Order>>({});
  const [detailLoadingIds, setDetailLoadingIds] = useState<string[]>([]);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, OrderStatus>>(
    {},
  );
  const [shippingDrafts, setShippingDrafts] = useState<
    Record<string, ShippingAddress>
  >({});
  const [shippingEditIds, setShippingEditIds] = useState<string[]>([]);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [updatingShippingId, setUpdatingShippingId] = useState<string | null>(
    null,
  );

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const getCustomerLabel = (order: Order) => {
    if (order.shippingAddress?.name) return order.shippingAddress.name;
    if (order.customerId) return order.customerId;
    return "Unknown";
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    orderService
      .list({
        page,
        limit,
        status: status === "ALL" ? undefined : status,
      })
      .then((res) => {
        if (!mounted) return;
        const payload = res.data.data;
        setOrders(payload.items || []);
        setTotalOrders(payload.pagination?.total || 0);
      })
      .catch((err) => {
        console.error(err);
        pushToast("error", getBackendErrorMessage(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [page, limit, status]);

  const totalPages = Math.max(1, Math.ceil(totalOrders / limit));

  const hydrateDrafts = (order: Order) => {
    setStatusDrafts((prev) =>
      prev[order.id] ? prev : { ...prev, [order.id]: order.orderStatus },
    );
    setShippingDrafts((prev) =>
      prev[order.id]
        ? prev
        : {
            ...prev,
            [order.id]: {
              name: order.shippingAddress?.name || "",
              address: order.shippingAddress?.address || "",
              city: order.shippingAddress?.city || "",
              phone: order.shippingAddress?.phone || "",
            },
          },
    );
  };

  const loadOrderDetail = async (orderId: string) => {
    setDetailLoadingIds((prev) => [...prev, orderId]);
    try {
      const res = await orderService.getById(orderId);
      const detail = res.data.data;
      setDetailOrders((prev) => ({ ...prev, [orderId]: detail }));
      hydrateDrafts(detail);
    } catch (err) {
      console.error(err);
      pushToast("error", getBackendErrorMessage(err));
    } finally {
      setDetailLoadingIds((prev) => prev.filter((id) => id !== orderId));
    }
  };

  const toggleExpand = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    const existing =
      detailOrders[orderId] || orders.find((o) => o.id === orderId);
    if (existing) hydrateDrafts(existing);
    if (!detailOrders[orderId]) loadOrderDetail(orderId);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handleUpdateStatus = async (orderId: string) => {
    const nextStatus = statusDrafts[orderId];
    if (!nextStatus) return;
    setUpdatingStatusId(orderId);
    try {
      await orderService.updateStatus(orderId, nextStatus);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, orderStatus: nextStatus } : order,
        ),
      );
      setDetailOrders((prev) =>
        prev[orderId]
          ? {
              ...prev,
              [orderId]: { ...prev[orderId], orderStatus: nextStatus },
            }
          : prev,
      );
      pushToast("success", "Order status updated.");
    } catch (err) {
      console.error(err);
      pushToast("error", getBackendErrorMessage(err));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleUpdateShipping = async (orderId: string) => {
    const draft = shippingDrafts[orderId];
    if (!draft) return;
    setUpdatingShippingId(orderId);
    try {
      const payload = {
        name: draft.name || "",
        address: draft.address || "",
        city: draft.city || "",
        phone: draft.phone || "",
      };
      const res = await orderService.updateShipping(orderId, payload);
      const updated = res.data.data;
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, shippingAddress: updated } : order,
        ),
      );
      setDetailOrders((prev) =>
        prev[orderId]
          ? {
              ...prev,
              [orderId]: { ...prev[orderId], shippingAddress: updated },
            }
          : prev,
      );
      setShippingEditIds((prev) => prev.filter((id) => id !== orderId));
      pushToast("success", "Shipping address updated.");
    } catch (err) {
      console.error(err);
      pushToast("error", getBackendErrorMessage(err));
    } finally {
      setUpdatingShippingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={dismissToast} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-slate-500 text-sm">
            Track and manage customer orders.
          </p>
        </div>
        <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Status:
              </span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as "ALL" | OrderStatus);
                  setPage(1);
                }}
                className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-slate-500">Rows:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Order ID</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td
                      colSpan={6}
                      className="px-6 py-8 h-16 bg-slate-50/50 dark:bg-slate-800/20"
                    ></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr
                      onClick={() => toggleExpand(order.id)}
                      className={cn(
                        "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer",
                        expandedOrderId === order.id &&
                          "bg-slate-50 dark:bg-slate-800/50",
                      )}
                    >
                      <td className="px-6 py-4 font-medium text-sm text-indigo-600 dark:text-indigo-400">
                        <div className="flex items-center gap-2">
                          {expandedOrderId === order.id ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                          {order.id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">
                            {getCustomerLabel(order).charAt(0)}
                          </div>
                          <span className="text-sm font-medium">
                            {getCustomerLabel(order)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">
                        ৳{order.totalPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            order.orderStatus === "DELIVERED" &&
                              "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                            order.orderStatus === "PENDING" &&
                              "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                            order.orderStatus === "SHIPPED" &&
                              "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
                            order.orderStatus === "CANCELLED" &&
                              "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
                          )}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                          {expandedOrderId === order.id ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>
                    {expandedOrderId === order.id && (
                      <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-inner">
                            {detailLoadingIds.includes(order.id) ? (
                              <div className="h-24 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg" />
                            ) : (
                              <div className="grid gap-6 lg:grid-cols-2">
                                <div>
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                    Order Items
                                  </h4>
                                  <div className="space-y-3">
                                    {(
                                      detailOrders[order.id]?.orderItems ||
                                      order.orderItems
                                    ).map((item, idx) => (
                                      <div
                                        key={item.id}
                                        className="flex justify-between items-center text-sm"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                            {idx + 1}
                                          </div>
                                          <div>
                                            <p className="font-medium">
                                              {item.product?.name || "Product"}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                              Qty: {item.quantity}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold">
                                            ৳
                                            {(
                                              item.price * item.quantity
                                            ).toFixed(2)}
                                          </p>
                                          <p className="text-xs text-slate-500">
                                            ৳{item.price.toFixed(2)} each
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                      <span className="text-sm font-bold">
                                        Total Amount
                                      </span>
                                      <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                                        ৳{order.totalPrice.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-5">
                                  <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                      Update Status
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={
                                          statusDrafts[order.id] ||
                                          order.orderStatus
                                        }
                                        onChange={(e) =>
                                          setStatusDrafts((prev) => ({
                                            ...prev,
                                            [order.id]: e.target
                                              .value as OrderStatus,
                                          }))
                                        }
                                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2"
                                      >
                                        <option value="PENDING">Pending</option>
                                        <option value="SHIPPED">Shipped</option>
                                        <option value="DELIVERED">
                                          Delivered
                                        </option>
                                        <option value="CANCELLED">
                                          Cancelled
                                        </option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateStatus(order.id)
                                        }
                                        disabled={updatingStatusId === order.id}
                                        className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-60"
                                      >
                                        {updatingStatusId === order.id
                                          ? "Saving"
                                          : "Save"}
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="mb-3 flex items-center justify-between">
                                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Shipping Address
                                      </h4>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setShippingEditIds((prev) =>
                                            prev.includes(order.id)
                                              ? prev.filter(
                                                  (id) => id !== order.id,
                                                )
                                              : [...prev, order.id],
                                          )
                                        }
                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                                      >
                                        {shippingEditIds.includes(order.id)
                                          ? "Cancel"
                                          : "Edit"}
                                      </button>
                                    </div>
                                    <div className="space-y-2">
                                      <input
                                        type="text"
                                        name={`shipping-name-${order.id}`}
                                        value={
                                          shippingDrafts[order.id]?.name || ""
                                        }
                                        autoComplete="new-password"
                                        disabled={
                                          !shippingEditIds.includes(order.id)
                                        }
                                        onChange={(e) =>
                                          setShippingDrafts((prev) => ({
                                            ...prev,
                                            [order.id]: {
                                              ...prev[order.id],
                                              name: e.target.value,
                                            },
                                          }))
                                        }
                                        placeholder="Recipient name"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2"
                                      />
                                      <input
                                        type="text"
                                        name={`shipping-address-${order.id}`}
                                        value={
                                          shippingDrafts[order.id]?.address ||
                                          ""
                                        }
                                        autoComplete="new-password"
                                        disabled={
                                          !shippingEditIds.includes(order.id)
                                        }
                                        onChange={(e) =>
                                          setShippingDrafts((prev) => ({
                                            ...prev,
                                            [order.id]: {
                                              ...prev[order.id],
                                              address: e.target.value,
                                            },
                                          }))
                                        }
                                        placeholder="Address"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2"
                                      />
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <input
                                          type="text"
                                          name={`shipping-city-${order.id}`}
                                          value={
                                            shippingDrafts[order.id]?.city || ""
                                          }
                                          autoComplete="new-password"
                                          disabled={
                                            !shippingEditIds.includes(order.id)
                                          }
                                          onChange={(e) =>
                                            setShippingDrafts((prev) => ({
                                              ...prev,
                                              [order.id]: {
                                                ...prev[order.id],
                                                city: e.target.value,
                                              },
                                            }))
                                          }
                                          placeholder="City"
                                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2"
                                        />
                                        <input
                                          type="text"
                                          name={`shipping-phone-${order.id}`}
                                          value={
                                            shippingDrafts[order.id]?.phone ||
                                            ""
                                          }
                                          autoComplete="new-password"
                                          disabled={
                                            !shippingEditIds.includes(order.id)
                                          }
                                          onChange={(e) =>
                                            setShippingDrafts((prev) => ({
                                              ...prev,
                                              [order.id]: {
                                                ...prev[order.id],
                                                phone: e.target.value,
                                              },
                                            }))
                                          }
                                          placeholder="Phone"
                                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateShipping(order.id)
                                        }
                                        disabled={
                                          updatingShippingId === order.id ||
                                          !shippingEditIds.includes(order.id)
                                        }
                                        className="w-full md:w-auto px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 disabled:opacity-60"
                                      >
                                        {updatingShippingId === order.id
                                          ? "Saving"
                                          : "Save Shipping"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {(page - 1) * limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {Math.min(page * limit, totalOrders)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {totalOrders}
            </span>{" "}
            orders
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-10 h-10 rounded-lg text-sm font-medium transition-colors",
                    page === p
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={handleNextPage}
              disabled={page === totalPages}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
