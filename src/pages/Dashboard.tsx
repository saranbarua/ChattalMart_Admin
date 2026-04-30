import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, PackageCheck, PackageX, Truck } from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { DashboardSummary, dashboardService } from "../services/api";
import { cn } from "../lib/utils";

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
        {title}
      </p>
      <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
    </div>
  </div>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await dashboardService.getStats();
        if (cancelled) return;
        setStats(res.data.data);
      } catch (err) {
        console.error(err);
        if (cancelled) return;
        setError("Failed to load dashboard summary.");
        setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading)
    return (
      <div className="animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"
            ></div>
          ))}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    );

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, Admin
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Here's what's happening with your store today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value={stats.orders.total}
          icon={ClipboardList}
          color="bg-indigo-600"
        />
        <StatCard
          title="Pending Orders"
          value={stats.orders.byStatus.PENDING}
          icon={ClipboardList}
          color="bg-amber-600"
        />
        <StatCard
          title="Shipped Orders"
          value={stats.orders.byStatus.SHIPPED}
          icon={Truck}
          color="bg-emerald-600"
        />
        <StatCard
          title="Delivered Orders"
          value={stats.orders.byStatus.DELIVERED}
          icon={PackageCheck}
          color="bg-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold">Orders Overview</h3>
              <p className="text-xs text-slate-500">
                Last {stats.windowDays} days ({formatDate(stats.range.from)} -{" "}
                {formatDate(stats.range.to)})
              </p>
            </div>
          </div>
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(stats.orders.byStatus).map(
                  ([statusKey, value]) => ({
                    name: statusKey,
                    value,
                  }),
                )}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold mb-8">Recent Orders</h3>
          <div className="space-y-6">
            {stats.orders.recent.length ? (
              stats.orders.recent.map((order) => (
                <div key={order.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400">
                    {order.customerId.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-bold">{order.customerId}</span>{" "}
                      placed an order
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDate(order.createdAt)}
                    </p>
                    <span
                      className={cn(
                        "mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
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
                  </div>
                  <span className="text-sm font-bold text-emerald-500">
                    ৳{order.totalPrice.toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">No recent orders.</div>
            )}
          </div>
          <button
            onClick={() => navigate("/orders")}
            className="w-full mt-8 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            View All Orders
          </button>
        </div>
      </div>
    </div>
  );
};
