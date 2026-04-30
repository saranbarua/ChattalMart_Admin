import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Filter,
  Image as ImageIcon,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import axios from "axios";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Category,
  Product,
  ProductBadge,
  ProductStatus,
  categoryService,
  productService,
} from "../services/api";
import { cn } from "../lib/utils";

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

  const containerClass =
    toast.type === "success"
      ? "border-green-200 bg-green-50 text-green-900"
      : "border-red-200 bg-red-50 text-red-900";
  const dot = toast.type === "success" ? "bg-green-500" : "bg-red-500";

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-200",
        containerClass,
        toast.open ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2",
      )}
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
    >
      <span className={cn("mt-1 h-2 w-2 rounded-full", dot)} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide">
          {toast.type === "success" ? "Success" : "Error"}
        </p>
        <p className="mt-0.5 wrap-break-word text-sm leading-snug">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="-mr-1 rounded-md p-1 text-current/70 hover:text-current/90"
        aria-label="Close toast"
      >
        <X size={16} />
      </button>
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
  const [present, setPresent] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setPresent(true);
      return;
    }

    const t = window.setTimeout(() => setPresent(false), durationMs);
    return () => window.clearTimeout(t);
  }, [isOpen, durationMs]);

  return present;
}

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, title, onClose, children }) => {
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
      className={cn(
        "fixed inset-0 z-60 flex items-start justify-center p-4 sm:items-center",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200 dark:border-slate-800 dark:bg-slate-900",
          "max-h-[calc(100vh-2rem)]",
          open
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-1 scale-[0.99]",
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
          <h3 className="text-xl font-bold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [urlDialogType, setUrlDialogType] = useState<"link" | "image">("link");
  const [urlDialogValue, setUrlDialogValue] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Image,
      Placeholder.configure({
        placeholder: placeholder || "Write product description...",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    // Keep editor content in sync when value changes externally (e.g. modal reset)
    const current = editor.getHTML();
    const next = value || "";
    if (current !== next) editor.commands.setContent(next);
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-32 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800">
        Loading editor...
      </div>
    );
  }

  const toolbarBtn = (active: boolean) =>
    cn(
      "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
      "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800",
      active
        ? "bg-slate-100 text-slate-900 dark:bg-slate-700"
        : "text-slate-700 dark:text-slate-200",
    );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={toolbarBtn(editor.isActive("bold"))}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={toolbarBtn(editor.isActive("italic"))}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={toolbarBtn(editor.isActive("underline"))}
        >
          Underline
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={toolbarBtn(editor.isActive("bulletList"))}
        >
          Bullets
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={toolbarBtn(editor.isActive("orderedList"))}
        >
          Numbered
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={toolbarBtn(editor.isActive("heading", { level: 1 }))}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={toolbarBtn(editor.isActive("heading", { level: 2 }))}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={toolbarBtn(editor.isActive("heading", { level: 3 }))}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => {
            const prev = editor.getAttributes("link").href as
              | string
              | undefined;
            setUrlDialogType("link");
            setUrlDialogValue(prev || "https://");
            setUrlDialogOpen(true);
          }}
          className={toolbarBtn(editor.isActive("link"))}
        >
          Link
        </button>
        <button
          type="button"
          onClick={() => {
            setUrlDialogType("image");
            setUrlDialogValue("https://");
            setUrlDialogOpen(true);
          }}
          className={toolbarBtn(false)}
        >
          Image
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().clearNodes().unsetAllMarks().run()
          }
          className={toolbarBtn(false)}
        >
          Clear
        </button>
      </div>

      <div className="rte">
        <EditorContent editor={editor} />
      </div>

      <Modal
        open={urlDialogOpen}
        title={urlDialogType === "link" ? "Insert Link" : "Insert Image"}
        onClose={() => setUrlDialogOpen(false)}
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              type="url"
              value={urlDialogValue}
              onChange={(e) => setUrlDialogValue(e.target.value)}
              placeholder="https://"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {urlDialogType === "link" ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Leave empty to remove the current link.
              </p>
            ) : null}
          </div>
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setUrlDialogOpen(false)}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const url = urlDialogValue.trim();
                if (urlDialogType === "link") {
                  if (!url) {
                    editor.chain().focus().unsetLink().run();
                  } else {
                    editor.chain().focus().setLink({ href: url }).run();
                  }
                } else {
                  if (url) editor.chain().focus().setImage({ src: url }).run();
                }
                setUrlDialogOpen(false);
              }}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              Insert
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const Products = () => {
  const USER_API_BASE_URL = "https://chattalmart.makeupcoders.com";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categoryId, setCategoryId] = useState<string>("ALL");
  const [status, setStatus] = useState<ProductStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<
    string | null
  >(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [confirmDeleteImageId, setConfirmDeleteImageId] = useState<
    string | null
  >(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    slug: "",
    previousPrice: "",
    currentPrice: "",
    description: "",
    badge: "" as "" | ProductBadge,
    status: "ACTIVE" as ProductStatus,
    categoryId: "",
    slugManuallyEdited: false,
  });

  const [editProduct, setEditProduct] = useState({
    id: "",
    name: "",
    slug: "",
    previousPrice: "",
    currentPrice: "",
    description: "",
    badge: "" as "" | ProductBadge,
    status: "ACTIVE" as ProductStatus,
    categoryId: "",
  });

  const revokeObjectUrls = (urls: string[]) => {
    urls.forEach((u) => {
      if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
    });
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

  const resolveImageUrl = (url: string) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    return `${USER_API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const productImageById = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      const url = p.productImages?.[0]?.url;
      if (url) map.set(p.id, resolveImageUrl(url));
    });
    return map;
  }, [products]);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.status === "ACTIVE"),
    [categories],
  );

  const resetNewProduct = () => {
    setNewProduct({
      name: "",
      slug: "",
      previousPrice: "",
      currentPrice: "",
      description: "",
      badge: "" as any,
      status: "ACTIVE",
      categoryId: "",
      slugManuallyEdited: false,
    });
    setImageFiles([]);
    revokeObjectUrls(imagePreviews);
    setImagePreviews([]);
  };

  const resetEditProduct = () => {
    setEditingProductId(null);
    setEditProduct({
      id: "",
      name: "",
      slug: "",
      previousPrice: "",
      currentPrice: "",
      description: "",
      badge: "" as any,
      status: "ACTIVE",
      categoryId: "",
    });
    setEditImageFiles([]);
    revokeObjectUrls(editImagePreviews);
    setEditImagePreviews([]);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetNewProduct();
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    resetEditProduct();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    return () => {
      revokeObjectUrls(imagePreviews);
      revokeObjectUrls(editImagePreviews);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [categoryId, debouncedSearch, status, page, limit]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await categoryService.getManageList({ page: 1, limit: 100 });
      setCategories(res.data.data.items);
    } catch (err) {
      console.error(err);
      const msg = getBackendErrorMessage(err);
      setError(msg);
      pushToast("error", msg);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.getManageList({
        page,
        limit,
        categoryId: categoryId === "ALL" ? undefined : categoryId,
        search: debouncedSearch || undefined,
        status: status === "ALL" ? undefined : status,
      });
      const payload = res.data.data;
      setProducts(payload.items);
      const nextTotal = payload.pagination?.total || 0;
      setTotalProducts(nextTotal);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / limit));
      if (page > nextTotalPages) setPage(nextTotalPages);
    } catch (err) {
      console.error(err);
      const msg = getBackendErrorMessage(err);
      setError(msg);
      pushToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const requestDeleteProduct = (id: string) => {
    setConfirmDeleteProductId(id);
  };

  const confirmDeleteProduct = async () => {
    if (!confirmDeleteProductId) return;
    const id = confirmDeleteProductId;
    setDeletingId(id);
    try {
      await productService.delete(id);
      pushToast("success", "Product deleted successfully");
      setConfirmDeleteProductId(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      pushToast("error", getBackendErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;
    setSubmitting(true);
    try {
      const descriptionNormalized = (newProduct.description || "")
        .replace(/<br\s*\/?>/gi, "")
        .replace(/&nbsp;/g, " ")
        .replace(/<[^>]*>/g, "")
        .trim();

      const createRes = await productService.create({
        name: newProduct.name,
        slug: newProduct.slug,
        previousPrice: parseFloat(newProduct.previousPrice),
        currentPrice: parseFloat(newProduct.currentPrice),
        description: descriptionNormalized ? newProduct.description : undefined,
        status: newProduct.status,
        badge: newProduct.badge ? newProduct.badge : undefined,
        categoryId: newProduct.categoryId,
      });

      const created = createRes.data.data;
      pushToast("success", "Product created successfully");

      if (imageFiles.length) {
        try {
          await productService.uploadImages(created.id, imageFiles);
          pushToast("success", "Product images uploaded successfully");
        } catch (uploadErr) {
          console.error(uploadErr);
          pushToast("error", getBackendErrorMessage(uploadErr));
        }
      }

      closeAddModal();
      fetchProducts();
    } catch (err) {
      console.error(err);
      pushToast("error", getBackendErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImageFiles(files);
    revokeObjectUrls(imagePreviews);
    setImagePreviews(files.slice(0, 4).map((f) => URL.createObjectURL(f)));
  };

  const openEditForProduct = (product: Product) => {
    setEditingProductId(product.id);
    setEditProduct({
      id: product.id,
      name: product.name,
      slug: product.slug,
      previousPrice: product.previousPrice.toString(),
      currentPrice: product.currentPrice.toString(),
      description: product.description || "",
      badge: (product.badge || "") as any,
      status: product.status,
      categoryId: product.category?.id || "",
    });
    setEditImageFiles([]);
    revokeObjectUrls(editImagePreviews);
    setEditImagePreviews([]);
    setShowEditModal(true);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setEditImageFiles(files);
    revokeObjectUrls(editImagePreviews);
    setEditImagePreviews(files.slice(0, 4).map((f) => URL.createObjectURL(f)));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editSubmitting) return;
    if (!editingProductId) return;

    setEditSubmitting(true);
    try {
      const descriptionNormalized = (editProduct.description || "")
        .replace(/<br\s*\/?>/gi, "")
        .replace(/&nbsp;/g, " ")
        .replace(/<[^>]*>/g, "")
        .trim();

      const updateRes = await productService.update(editingProductId, {
        name: editProduct.name,
        slug: editProduct.slug,
        previousPrice: parseFloat(editProduct.previousPrice),
        currentPrice: parseFloat(editProduct.currentPrice),
        description: descriptionNormalized
          ? editProduct.description
          : undefined,
        status: editProduct.status,
        badge: editProduct.badge ? editProduct.badge : undefined,
        categoryId: editProduct.categoryId,
      });

      pushToast(
        "success",
        updateRes.data.message || "Product updated successfully",
      );

      if (editImageFiles.length) {
        try {
          await productService.uploadImages(editingProductId, editImageFiles);
          pushToast("success", "Product images uploaded successfully");
        } catch (uploadErr) {
          console.error(uploadErr);
          pushToast("error", getBackendErrorMessage(uploadErr));
        }
      }

      closeEditModal();
      fetchProducts();
    } catch (err) {
      console.error(err);
      pushToast("error", getBackendErrorMessage(err));
    } finally {
      setEditSubmitting(false);
    }
  };

  const requestDeleteProductImage = (imageId: string) => {
    setConfirmDeleteImageId(imageId);
  };

  const confirmDeleteProductImage = async () => {
    if (!editingProductId) return;
    if (!confirmDeleteImageId) return;
    if (deletingImageId) return;

    const imageId = confirmDeleteImageId;
    setDeletingImageId(imageId);
    try {
      await productService.deleteImage(editingProductId, imageId);
      pushToast("success", "Product image deleted successfully");
      setConfirmDeleteImageId(null);

      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProductId
            ? {
                ...p,
                productImages: (p.productImages || []).filter(
                  (img) => img.id !== imageId,
                ),
              }
            : p,
        ),
      );
    } catch (err) {
      console.error(err);
      pushToast("error", getBackendErrorMessage(err));
    } finally {
      setDeletingImageId(null);
    }
  };

  useEffect(() => {
    if (!newProduct.name) return;
    const generated = newProduct.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setNewProduct((p) => {
      if (!p.slugManuallyEdited) {
        return { ...p, slug: generated };
      }
      return p;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newProduct.name]);

  useEffect(() => {
    if (!showEditModal) return;
    if (!editProduct.name) return;
    const generated = editProduct.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setEditProduct((p) => (p.slug ? p : { ...p, slug: generated }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editProduct.name, showEditModal]);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={dismissToast} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-slate-500 text-sm">
            Manage your store inventory and catalog.
          </p>
        </div>
        <button
          onClick={() => {
            setNewProduct((prev) => ({
              ...prev,
              slug: "",
              slugManuallyEdited: false,
            }));
            setShowAddModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Filter size={18} />
              Filter
            </button>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="flex-1 sm:flex-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {categoriesLoading ? (
                <option value="" disabled>
                  Loading...
                </option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any);
                setPage(1);
              }}
              className="flex-1 sm:flex-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="flex-1 sm:flex-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-indigo-500"
              aria-label="Rows per page"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {error ? (
            <div className="p-12 text-center">
              <p className="text-rose-500 font-medium mb-4">{error}</p>
              <button
                onClick={fetchProducts}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                Retry Loading
              </button>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Current</th>
                  <th className="px-6 py-4 font-semibold">Previous</th>
                  <th className="px-6 py-4 font-semibold">Badge</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td
                        colSpan={7}
                        className="px-6 py-8 h-16 bg-slate-50/50 dark:bg-slate-800/20"
                      ></td>
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      No products found. Add your first product to get started.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={
                                productImageById.get(product.id) ||
                                `https://picsum.photos/seed/${product.id}/200/200`
                              }
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                            />
                            {product.productImages?.length > 1 ? (
                              <span className="absolute -right-1 -top-1 rounded-full bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5">
                                +{product.productImages.length - 1}
                              </span>
                            ) : null}
                          </div>
                          <span className="font-medium text-sm">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {product.category?.name}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        ৳{product.currentPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        ৳{product.previousPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {product.badge ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            product.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                          )}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditForProduct(product)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            disabled={deletingId === product.id}
                            onClick={() => requestDeleteProduct(product.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === product.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        {!error ? (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {(page - 1) * limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {Math.min(page * limit, totalProducts)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {totalProducts}
              </span>{" "}
              products
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from(
                  {
                    length: Math.max(1, Math.ceil(totalProducts / limit)),
                  },
                  (_, i) => i + 1,
                ).map((p) => (
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
                onClick={() =>
                  setPage((p) =>
                    Math.min(
                      Math.max(1, Math.ceil(totalProducts / limit)),
                      p + 1,
                    ),
                  )
                }
                disabled={page >= Math.max(1, Math.ceil(totalProducts / limit))}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Add Product Modal */}
      <Modal
        open={showAddModal}
        title="Add New Product"
        onClose={closeAddModal}
      >
        <form onSubmit={handleAdd} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Product Name
            </label>
            <input
              required
              type="text"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug</label>
            <input
              required
              type="text"
              value={newProduct.slug}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  slug: e.target.value,
                  slugManuallyEdited: true,
                })
              }
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              title="Lowercase letters, numbers, and hyphens only (e.g. premium-wireless-headphones)"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Previous Price
              </label>
              <input
                required
                type="number"
                step="0.01"
                value={newProduct.previousPrice}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    previousPrice: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Current Price
              </label>
              <input
                required
                type="number"
                step="0.01"
                value={newProduct.currentPrice}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    currentPrice: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              required
              value={newProduct.categoryId}
              onChange={(e) =>
                setNewProduct({ ...newProduct, categoryId: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select Category</option>
              {categoriesLoading ? (
                <option value="" disabled>
                  Loading...
                </option>
              ) : (
                activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={newProduct.status}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    status: e.target.value as ProductStatus,
                  })
                }
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Badge</label>
              <select
                value={newProduct.badge}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    badge: e.target.value as any,
                  })
                }
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">None</option>
                <option value="NEW">NEW</option>
                <option value="SALE">SALE</option>
                <option value="BEST_SELLER">BEST_SELLER</option>
                <option value="SOLD_OUT">SOLD_OUT</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <RichTextEditor
              value={newProduct.description}
              onChange={(html) =>
                setNewProduct({
                  ...newProduct,
                  description: html,
                })
              }
              placeholder="Write product description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Product Images
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800 shrink-0">
                {imagePreviews.length ? (
                  <div className="relative w-full h-full">
                    <img
                      src={imagePreviews[0]}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {imageFiles.length > 1 ? (
                      <span className="absolute bottom-1 right-1 rounded-md bg-slate-900/80 text-white text-[10px] font-semibold px-1.5 py-0.5">
                        {imageFiles.length} files
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <ImageIcon className="text-slate-400" size={24} />
                )}
              </div>
              <label className="flex-1 cursor-pointer">
                <div className="flex flex-col items-center justify-center py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Upload size={18} className="text-slate-500 mb-1" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Click to upload
                  </span>
                  <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {imageFiles.length
                      ? `${imageFiles.length} selected`
                      : "You can select multiple"}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={closeAddModal}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal open={showEditModal} title="Edit Product" onClose={closeEditModal}>
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Product Name
            </label>
            <input
              required
              type="text"
              value={editProduct.name}
              onChange={(e) =>
                setEditProduct({ ...editProduct, name: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug</label>
            <input
              required
              type="text"
              value={editProduct.slug}
              onChange={(e) =>
                setEditProduct({ ...editProduct, slug: e.target.value })
              }
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              title="Lowercase letters, numbers, and hyphens only (e.g. premium-wireless-headphones)"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Previous Price
              </label>
              <input
                required
                type="number"
                step="0.01"
                value={editProduct.previousPrice}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    previousPrice: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Current Price
              </label>
              <input
                required
                type="number"
                step="0.01"
                value={editProduct.currentPrice}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    currentPrice: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              required
              value={editProduct.categoryId}
              onChange={(e) =>
                setEditProduct({ ...editProduct, categoryId: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select Category</option>
              {categoriesLoading ? (
                <option value="" disabled>
                  Loading...
                </option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.status === "INACTIVE" ? " (INACTIVE)" : ""}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={editProduct.status}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    status: e.target.value as ProductStatus,
                  })
                }
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Badge</label>
              <select
                value={editProduct.badge}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    badge: e.target.value as any,
                  })
                }
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">None</option>
                <option value="NEW">NEW</option>
                <option value="SALE">SALE</option>
                <option value="BEST_SELLER">BEST_SELLER</option>
                <option value="SOLD_OUT">SOLD_OUT</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <RichTextEditor
              value={editProduct.description}
              onChange={(html) =>
                setEditProduct({
                  ...editProduct,
                  description: html,
                })
              }
              placeholder="Write product description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload More Images
            </label>

            {editingProductId ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {(
                  products.find((p) => p.id === editingProductId)
                    ?.productImages || []
                )
                  .slice(0, 6)
                  .map((img) => (
                    <div
                      key={img.id}
                      className="relative h-12 w-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group"
                    >
                      <img
                        src={resolveImageUrl(img.url)}
                        alt="Product"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        disabled={deletingImageId === img.id}
                        onClick={() => requestDeleteProductImage(img.id)}
                        className="absolute top-1 right-1 rounded-md bg-white/90 hover:bg-white p-1 text-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100 disabled:cursor-not-allowed dark:bg-slate-900/90 dark:hover:bg-slate-900 dark:text-slate-100"
                        aria-label="Delete product image"
                        title="Delete image"
                      >
                        {deletingImageId === img.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  ))}
                {(products.find((p) => p.id === editingProductId)?.productImages
                  ?.length || 0) > 6 ? (
                  <span className="h-12 px-3 inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                    +
                    {(products.find((p) => p.id === editingProductId)
                      ?.productImages.length || 0) - 6}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800 shrink-0">
                {editImagePreviews.length ? (
                  <div className="relative w-full h-full">
                    <img
                      src={editImagePreviews[0]}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {editImageFiles.length > 1 ? (
                      <span className="absolute bottom-1 right-1 rounded-md bg-slate-900/80 text-white text-[10px] font-semibold px-1.5 py-0.5">
                        {editImageFiles.length} files
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <ImageIcon className="text-slate-400" size={24} />
                )}
              </div>
              <label className="flex-1 cursor-pointer">
                <div className="flex flex-col items-center justify-center py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Upload size={18} className="text-slate-500 mb-1" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Click to upload
                  </span>
                  <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {editImageFiles.length
                      ? `${editImageFiles.length} selected`
                      : "You can select multiple"}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleEditImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={closeEditModal}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {editSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Product Delete */}
      <Modal
        open={!!confirmDeleteProductId}
        title="Delete Product"
        onClose={() => setConfirmDeleteProductId(null)}
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete this product? This is a soft delete
            and will set the product status to INACTIVE.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setConfirmDeleteProductId(null)}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                !confirmDeleteProductId || deletingId === confirmDeleteProductId
              }
              onClick={confirmDeleteProduct}
              className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {deletingId === confirmDeleteProductId ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Product Image Delete */}
      <Modal
        open={!!confirmDeleteImageId}
        title="Delete Product Image"
        onClose={() => setConfirmDeleteImageId(null)}
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to permanently delete this image?
          </p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setConfirmDeleteImageId(null)}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                !confirmDeleteImageId ||
                deletingImageId === confirmDeleteImageId
              }
              onClick={confirmDeleteProductImage}
              className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {deletingImageId === confirmDeleteImageId
                ? "Deleting..."
                : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
