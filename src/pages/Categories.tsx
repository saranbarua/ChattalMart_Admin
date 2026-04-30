import React, { useEffect, useMemo, useState } from "react";
import {
  categoryService,
  type Category,
  type CreateCategoryPayload,
  type UpdateCategoryPayload,
  type PaginatedResponse,
} from "../services/api";

// Types for state management
export interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  success: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
  isCreating: boolean;
  isUpdating: boolean;
  editingCategory: Category | null;
}

// Custom hook for categories management
function useCategories() {
  const getBackendErrorMessage = (err: any, fallback: string) => {
    const data = err?.response?.data;

    if (typeof data === "string" && data.trim()) return data;

    const backendMessage =
      (typeof data?.error?.message === "string" && data.error.message) ||
      (typeof data?.message === "string" && data.message) ||
      (typeof err?.message === "string" && err.message);

    const details = Array.isArray(data?.error?.details)
      ? (data.error.details as unknown[]).filter((d) => typeof d === "string")
      : [];

    if (backendMessage && details.length > 0) {
      return `${backendMessage}: ${details.join(", ")}`;
    }

    return backendMessage || fallback;
  };

  const [state, setState] = useState<CategoryState>({
    categories: [],
    loading: true,
    error: null,
    success: null,
    pagination: null,
    isCreating: false,
    isUpdating: false,
    editingCategory: null,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");

  // Clear messages after delay
  useEffect(() => {
    if (state.success || state.error) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, success: null, error: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.success, state.error]);

  const loadCategories = async (page = 1, search = "", status?: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const params: any = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (status && status !== "ALL") params.status = status;

      const response = await categoryService.getManageList(params);

      setState((prev) => ({
        ...prev,
        categories: response.data.data.items,
        pagination: response.data.data.pagination,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: getBackendErrorMessage(error, "Failed to load categories"),
        loading: false,
      }));
    }
  };

  const createCategory = async (payload: CreateCategoryPayload) => {
    try {
      setState((prev) => ({ ...prev, isCreating: true, error: null }));

      await categoryService.create(payload);

      setState((prev) => ({
        ...prev,
        isCreating: false,
        success: "Category created successfully",
      }));

      // Reload categories
      await loadCategories(
        currentPage,
        searchTerm,
        statusFilter === "ALL" ? undefined : statusFilter,
      );

      return true;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isCreating: false,
        error: getBackendErrorMessage(error, "Failed to create category"),
      }));

      return false;
    }
  };

  const updateCategory = async (id: string, payload: UpdateCategoryPayload) => {
    try {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));

      await categoryService.update(id, payload);

      setState((prev) => ({
        ...prev,
        isUpdating: false,
        success: "Category updated successfully",
        editingCategory: null,
      }));

      // Reload categories
      await loadCategories(
        currentPage,
        searchTerm,
        statusFilter === "ALL" ? undefined : statusFilter,
      );

      return true;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isUpdating: false,
        error: getBackendErrorMessage(error, "Failed to update category"),
      }));

      return false;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      await categoryService.delete(id);

      setState((prev) => ({
        ...prev,
        success: "Category deleted successfully",
      }));

      // Reload categories
      await loadCategories(
        currentPage,
        searchTerm,
        statusFilter === "ALL" ? undefined : statusFilter,
      );

      return true;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: getBackendErrorMessage(error, "Failed to delete category"),
      }));

      return false;
    }
  };

  const startEdit = (category: Category) => {
    setState((prev) => ({ ...prev, editingCategory: category }));
  };

  const cancelEdit = () => {
    setState((prev) => ({ ...prev, editingCategory: null }));
  };

  const clearSuccess = () => {
    setState((prev) => ({ ...prev, success: null }));
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
    loadCategories(
      1,
      search,
      statusFilter === "ALL" ? undefined : statusFilter,
    );
  };

  const handleStatusFilter = (status: "ALL" | "ACTIVE" | "INACTIVE") => {
    setStatusFilter(status);
    setCurrentPage(1);
    loadCategories(1, searchTerm, status === "ALL" ? undefined : status);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadCategories(
      page,
      searchTerm,
      statusFilter === "ALL" ? undefined : statusFilter,
    );
  };

  // Load initial data
  useEffect(() => {
    loadCategories();
  }, []);

  return {
    ...state,
    currentPage,
    searchTerm,
    statusFilter,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    startEdit,
    cancelEdit,
    clearSuccess,
    clearError,
    handleSearch,
    handleStatusFilter,
    handlePageChange,
  };
}

// Message Banner Component
interface MessageBannerProps {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}

const MessageBanner: React.FC<MessageBannerProps> = ({
  type,
  message,
  onClose,
}) => (
  <div
    className={`p-4 mb-6 rounded-lg flex items-center justify-between ${
      type === "success"
        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
    }`}
  >
    <span>{message}</span>
    <button
      onClick={onClose}
      className={`ml-4 ${type === "success" ? "text-green-500 hover:text-green-700" : "text-red-500 hover:text-red-700"}`}
      aria-label="Close message"
    >
      ✕
    </button>
  </div>
);

type ToastType = "success" | "error";
type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  open: boolean;
};

const Toast: React.FC<{
  toast: ToastItem;
  onClose: (id: string) => void;
}> = ({ toast, onClose }) => {
  const isPresent = usePresence(toast.open, 180);
  if (!isPresent) return null;

  const tone =
    toast.type === "success"
      ? "border-green-200 bg-white text-gray-900 dark:border-green-900/40 dark:bg-gray-800 dark:text-white"
      : "border-red-200 bg-white text-gray-900 dark:border-red-900/40 dark:bg-gray-800 dark:text-white";

  const dot = toast.type === "success" ? "bg-green-500" : "bg-red-500";

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm transform rounded-xl border shadow-lg transition-all duration-200 ${tone} ${
        toast.open ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
      }`}
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
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
}> = ({ toasts, onClose }) => {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-9999 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  );
};

function usePresence(isOpen: boolean, durationMs = 180) {
  const [isPresent, setIsPresent] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsPresent(true);
      return;
    }

    const timeout = setTimeout(() => setIsPresent(false), durationMs);
    return () => clearTimeout(timeout);
  }, [isOpen, durationMs]);

  return isPresent;
}

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  open,
  title,
  onClose,
  children,
  footer,
}) => {
  const isPresent = usePresence(open, 180);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!isPresent) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        open ? "" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onMouseDown={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full max-w-xl transform overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg transition-all duration-200 dark:border-gray-700 dark:bg-gray-800 ${
          open
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-2 scale-95"
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};

// Form Components
interface CategoryFormProps {
  category?: Category | null;
  onSubmit: (payload: CreateCategoryPayload | UpdateCategoryPayload) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
    status: category?.status || ("ACTIVE" as const),
  });

  useEffect(() => {
    setFormData({
      name: category?.name || "",
      slug: category?.slug || "",
      status: category?.status || ("ACTIVE" as const),
    });
  }, [category?.id]);

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Only auto-generate slug if it's empty or hasn't been manually edited
      slug:
        !prev.slug || prev.slug === generateSlug(prev.name)
          ? generateSlug(name)
          : prev.slug,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      status: formData.status,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          required
          maxLength={255}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Slug <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.slug}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, slug: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          required
          maxLength={255}
          pattern="[a-z0-9-]+"
          placeholder="lowercase-and-hyphen-separated"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Lowercase letters, numbers, and hyphens only
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              status: e.target.value as "ACTIVE" | "INACTIVE",
            }))
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          disabled={isLoading}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || !formData.name.trim() || !formData.slug.trim()}
        >
          {isLoading ? "Saving..." : category ? "Update" : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md"
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// Search and Filter Component
interface SearchFilterProps {
  searchTerm: string;
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  onSearch: (search: string) => void;
  onStatusFilter: (status: "ALL" | "ACTIVE" | "INACTIVE") => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  statusFilter,
  onSearch,
  onStatusFilter,
}) => (
  <div className="flex flex-wrap gap-4 mb-6">
    <div className="flex-1 min-w-64">
      <input
        type="text"
        placeholder="Search categories..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
      />
    </div>
    <div>
      <select
        value={statusFilter}
        onChange={(e) =>
          onStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")
        }
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
      >
        <option value="ALL">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>
    </div>
  </div>
);

// Category List Component
interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onEdit,
  onDelete,
  loading,
}) => {
  const loadingRows = useMemo(() => Array.from({ length: 6 }, (_, i) => i), []);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              loadingRows.map((i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-56 rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="ml-auto h-8 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                </tr>
              ))
            ) : categories.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-14 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr
                  key={category.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                      {category.slug}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                        category.status === "ACTIVE"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                      }`}
                    >
                      {category.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onEdit(category)}
                        className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/20"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(category.id)}
                        className="rounded-md px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Pagination Component
interface PaginationProps {
  pagination: CategoryState["pagination"];
  currentPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  pagination,
  currentPage,
  onPageChange,
}) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const pages = Array.from({ length: pagination.totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Showing page {pagination.page} of {pagination.totalPages} (
        {pagination.total} total categories)
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!pagination.hasPrevPage}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 text-sm rounded-md ${
              page === currentPage
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!pagination.hasNextPage}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

// Main Categories Component
export default function Categories() {
  const {
    categories,
    loading,
    error,
    success,
    pagination,
    currentPage,
    searchTerm,
    statusFilter,
    isCreating,
    isUpdating,
    editingCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    startEdit,
    cancelEdit,
    clearSuccess,
    clearError,
    handleSearch,
    handleStatusFilter,
    handlePageChange,
  } = useCategories();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const deleteTarget = useMemo(
    () => categories.find((c) => c.id === deleteTargetId) || null,
    [categories, deleteTargetId],
  );

  const pushToast = (type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const toast: ToastItem = { id, type, message, open: true };
    setToasts((prev) => [toast, ...prev].slice(0, 4));

    window.setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, open: false } : t)),
      );
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 220);
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, open: false } : t)),
    );
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 220);
  };

  useEffect(() => {
    if (success) {
      pushToast("success", success);
      clearSuccess();
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      pushToast("error", error);
      clearError();
    }
  }, [error]);

  const handleCreateSubmit = async (payload: CreateCategoryPayload) => {
    const ok = await createCategory(payload);
    if (ok) setShowCreateForm(false);
  };

  const handleUpdateSubmit = async (payload: UpdateCategoryPayload) => {
    if (editingCategory) {
      const ok = await updateCategory(editingCategory.id, payload);
      if (ok) cancelEdit();
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const ok = await deleteCategory(deleteTargetId);
    if (ok) setDeleteTargetId(null);
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={dismissToast} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Categories
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your categories with search, filters, and quick actions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          Create Category
        </button>
      </div>

      {/* Messages are shown as toasts */}

      <Modal
        open={showCreateForm}
        title="Create New Category"
        onClose={() => setShowCreateForm(false)}
      >
        <CategoryForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowCreateForm(false)}
          isLoading={isCreating}
        />
      </Modal>

      <Modal
        open={Boolean(editingCategory)}
        title="Edit Category"
        onClose={cancelEdit}
      >
        <CategoryForm
          category={editingCategory}
          onSubmit={handleUpdateSubmit}
          onCancel={cancelEdit}
          isLoading={isUpdating}
        />
      </Modal>

      <Modal
        open={Boolean(deleteTargetId)}
        title="Delete Category"
        onClose={() => setDeleteTargetId(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteTargetId(null)}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              disabled={false}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-200">
            This will soft-delete the category and set its status to INACTIVE.
          </p>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-200">
            <div className="font-medium">
              {deleteTarget?.name || "Selected category"}
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {deleteTarget?.slug}
            </div>
          </div>
        </div>
      </Modal>

      {/* Search and Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <SearchFilter
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
        />
      </div>

      {/* Category List */}
      <CategoryList
        categories={categories}
        onEdit={startEdit}
        onDelete={(id) => setDeleteTargetId(id)}
        loading={loading}
      />

      {/* Pagination */}
      <Pagination
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
