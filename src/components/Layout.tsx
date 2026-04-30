import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Tags,
} from "lucide-react";
import { useAuthStore, useThemeStore } from "../store";
import { cn } from "../lib/utils";

const SidebarItem = ({
  icon: Icon,
  label,
  href,
  collapsed,
}: {
  icon: any;
  label: string;
  href: string;
  collapsed: boolean;
}) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
        isActive
          ? "bg-indigo-600 text-white"
          : "text-slate-400 hover:bg-slate-800 hover:text-white",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon
        size={20}
        className={cn(!isActive && "group-hover:text-indigo-400")}
      />
      {!collapsed && <span className="font-medium">{label}</span>}
    </Link>
  );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const canManageCategories =
    user?.role === "ADMIN" || user?.role === "MODERATOR";
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col",
          isSidebarCollapsed ? "w-20" : "w-64",
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              N
            </div>
            {!isSidebarCollapsed && (
              <span className="text-xl font-bold text-white tracking-tight">
                Nexus Admin
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            href="/"
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem
            icon={ShoppingBag}
            label="Orders"
            href="/orders"
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem
            icon={Package}
            label="Products"
            href="/products"
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem
            icon={Users}
            label="Customers"
            href="/customers"
            collapsed={isSidebarCollapsed}
          />
          {isAdmin && (
            <SidebarItem
              icon={Users}
              label="Users"
              href="/users"
              collapsed={isSidebarCollapsed}
            />
          )}
          {canManageCategories && (
            <SidebarItem
              icon={Tags}
              label="Categories"
              href="/categories"
              collapsed={isSidebarCollapsed}
            />
          )}
          <div className="pt-4 mt-4 border-t border-slate-800">
            <SidebarItem
              icon={UserCircle}
              label="Profile"
              href="/profile"
              collapsed={isSidebarCollapsed}
            />
            <SidebarItem
              icon={Settings}
              label="Settings"
              href="/settings"
              collapsed={isSidebarCollapsed}
            />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors",
              isSidebarCollapsed && "justify-center",
            )}
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>

        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 bg-indigo-600 text-white rounded-full p-1 border-2 border-slate-900 hover:bg-indigo-500 transition-colors"
        >
          {isSidebarCollapsed ? (
            <ChevronRight size={14} />
          ) : (
            <ChevronLeft size={14} />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          isSidebarCollapsed ? "ml-20" : "ml-64",
        )}
      >
        {/* Navbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md hidden md:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-1 transition-colors group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {user?.name || user?.username || "Admin"}
                  </p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    {user?.role || "ADMIN"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border-2 border-indigo-500/20 group-hover:border-indigo-500/40 transition-colors">
                  {(user?.name || user?.username)?.charAt(0)?.toUpperCase() ||
                    "A"}
                </div>
              </Link>
            </div>
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};
