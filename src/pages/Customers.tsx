import React, { useState, useEffect } from "react";
import { Search, Mail, Phone } from "lucide-react";
import axios from "axios";
import {
  customerService,
  Customer,
  CustomerWithOrders,
  UserStatus,
} from "../services/api";

export const Customers = () => {
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

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | UserStatus>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [total, setTotal] = useState(0);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailCustomer, setDetailCustomer] =
    useState<CustomerWithOrders | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    customerService
      .list({
        page,
        limit,
        q: q || undefined,
        status: status === "ALL" ? undefined : status,
        from: from || undefined,
        to: to || undefined,
      })
      .then((res) => {
        if (!mounted) return;
        const payload = res.data.data;
        const items = payload?.items || [];
        setCustomers(items);
        const nextTotal = payload?.total ?? 0;
        setTotal(nextTotal);
        const totalPages = Math.max(1, Math.ceil(nextTotal / limit));
        if (page > totalPages) setPage(totalPages);
      })
      .catch((err) => {
        console.error("Failed to fetch customers", err);
        pushToast("error", getBackendErrorMessage(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [page, limit, q, status, from, to]);

  useEffect(() => {
    if (!selectedId) return;
    let mounted = true;
    setDetailLoading(true);
    customerService
      .getById(selectedId)
      .then((res) => {
        if (!mounted) return;
        setDetailCustomer(res.data.data);
      })
      .catch((err) => {
        console.error("Failed to fetch customer", err);
        pushToast("error", getBackendErrorMessage(err));
      })
      .finally(() => {
        if (mounted) setDetailLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedId]);

  const openDetails = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const closeDetails = () => {
    setDetailOpen(false);
    setSelectedId(null);
    setDetailCustomer(null);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleDeactivate = async (id: string) => {
    try {
      setProcessingIds((s) => [...s, id]);
      await customerService.deactivate(id);
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "INACTIVE" } : c)),
      );
      setDetailCustomer((prev) =>
        prev && prev.id === id ? { ...prev, status: "INACTIVE" } : prev,
      );
      pushToast("success", "Customer deactivated successfully");
    } catch (err) {
      console.error(err);
      pushToast("error", getBackendErrorMessage(err));
    } finally {
      setProcessingIds((s) => s.filter((x) => x !== id));
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      setProcessingIds((s) => [...s, id]);
      const res = await customerService.reactivate(id);
      const updated = res.data.data;
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: updated.status } : c)),
      );
      setDetailCustomer((prev) =>
        prev && prev.id === id ? { ...prev, status: updated.status } : prev,
      );
      pushToast("success", "Customer reactivated successfully");
    } catch (err) {
      console.error(err);
      pushToast("error", getBackendErrorMessage(err));
    } finally {
      setProcessingIds((s) => s.filter((x) => x !== id));
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={dismissToast} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-slate-500 text-sm">
          View and manage your customer relationships.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative w-full max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by phone, name, or email..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as "ALL" | UserStatus);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              aria-label="From date"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              aria-label="To date"
            />
            <div className="ml-auto flex items-center gap-2 text-sm text-slate-500">
              <span>Total: {total}</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm"
                aria-label="Rows per page"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0 divide-x divide-y divide-slate-200 dark:divide-slate-800">
          {loading
            ? [1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-56 animate-pulse bg-slate-50/50 dark:bg-slate-800/20"
                ></div>
              ))
            : customers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col"
                >
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                        {(customer.name || customer.email || "U").charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold">
                          {customer.name || customer.email || "Unnamed"}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                          ID: {customer.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600">
                        {customer.status || "ACTIVE"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <Mail size={16} className="text-slate-400" />
                      {customer.email || "—"}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <Phone size={16} className="text-slate-400" />
                      {customer.phone || "—"}
                    </div>
                    <div className="text-xs text-slate-400">
                      Created: {formatDate(customer.createdAt)}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => openDetails(customer.id)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      View details
                    </button>
                    {customer.status === "INACTIVE" ? (
                      <button
                        disabled={processingIds.includes(customer.id)}
                        onClick={() => handleReactivate(customer.id)}
                        className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-md"
                      >
                        {processingIds.includes(customer.id)
                          ? "..."
                          : "Reactivate"}
                      </button>
                    ) : (
                      <button
                        disabled={processingIds.includes(customer.id)}
                        onClick={() => handleDeactivate(customer.id)}
                        className="text-xs bg-rose-500 text-white px-3 py-1 rounded-md"
                      >
                        {processingIds.includes(customer.id)
                          ? "..."
                          : "Deactivate"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
        </div>
        {!loading && customers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No customers found.
          </div>
        ) : null}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-600">
          <div>
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {detailOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30">
          <div className="h-full w-full max-w-2xl bg-white dark:bg-slate-900 shadow-xl overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Customer details</h2>
                <p className="text-xs text-slate-500">{selectedId}</p>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="px-2 py-1 rounded-md text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              {detailLoading ? (
                <div className="h-32 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              ) : detailCustomer ? (
                <>
                  <div className="grid gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">Name:</span>{" "}
                      {detailCustomer.name || "—"}
                    </div>
                    <div>
                      <span className="text-slate-400">Email:</span>{" "}
                      {detailCustomer.email || "—"}
                    </div>
                    <div>
                      <span className="text-slate-400">Phone:</span>{" "}
                      {detailCustomer.phone || "—"}
                    </div>
                    <div>
                      <span className="text-slate-400">Status:</span>{" "}
                      {detailCustomer.status || "ACTIVE"}
                    </div>
                    <div>
                      <span className="text-slate-400">Created:</span>{" "}
                      {formatDate(detailCustomer.createdAt)}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3">
                      Recent orders
                    </h3>
                    {detailCustomer.orders &&
                    detailCustomer.orders.length > 0 ? (
                      <div className="space-y-3">
                        {detailCustomer.orders.map((order) => (
                          <div
                            key={order.id}
                            className="rounded-lg border border-slate-200 dark:border-slate-800 p-4"
                          >
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-semibold">
                                Order {order.id}
                              </span>
                              <span className="text-slate-500">
                                {order.orderStatus}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                              Total: ৳{order.totalPrice}
                            </div>
                            <div className="mt-3 space-y-2">
                              {order.orderItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span>
                                    {item.product?.name || "Product"} x
                                    {item.quantity}
                                  </span>
                                  <span>৳{item.price}</span>
                                </div>
                              ))}
                            </div>
                            {order.shippingAddress ? (
                              <div className="mt-3 text-xs text-slate-500">
                                Ship to: {order.shippingAddress.name || ""}{" "}
                                {order.shippingAddress.address || ""}{" "}
                                {order.shippingAddress.city || ""}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">
                        No orders found.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-500">No data.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
