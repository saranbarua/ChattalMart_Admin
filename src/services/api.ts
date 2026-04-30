import axios from "axios";
import { useAuthStore } from "../store";

const api = axios.create({
  baseURL: "/api",
});

const userApi = axios.create({
  baseURL: "https://chattalmart.makeupcoders.com",
});

const attachAuthToken = (config: any) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(attachAuthToken);
userApi.interceptors.request.use(attachAuthToken);

export type UserRole = "ADMIN" | "MODERATOR";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type CategoryStatus = "ACTIVE" | "INACTIVE";
export type ProductStatus = "ACTIVE" | "INACTIVE";
export type ProductBadge = "NEW" | "SALE" | "BEST_SELLER" | "SOLD_OUT";

export interface User {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  status: CategoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategoryRef {
  id: string;
  name: string;
  slug: string;
  status?: CategoryStatus;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProductStatus;
  badge: ProductBadge | null;
  previousPrice: number;
  currentPrice: number;
  category: ProductCategoryRef;
  productImages: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardOrderSummary {
  id: string;
  totalPrice: number;
  orderStatus: OrderStatus;
  createdAt: string;
  customerId: string;
}

export interface DashboardSummary {
  windowDays: number;
  range: { from: string; to: string };
  orders: {
    total: number;
    byStatus: Record<OrderStatus, number>;
    recent: DashboardOrderSummary[];
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

interface ApiError {
  success: false;
  message: string;
  code?: string;
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface UpdateUserPayload {
  name?: string;
  username?: string;
  email?: string | null;
  password?: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  status?: CategoryStatus;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  status?: CategoryStatus;
}

export interface CategoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CategoryStatus;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  status?: ProductStatus;
}

export interface CreateProductPayload {
  name: string;
  slug: string;
  previousPrice: number;
  currentPrice: number;
  description?: string;
  status?: ProductStatus;
  badge?: ProductBadge;
  categoryId: string;
}

export interface UpdateProductPayload {
  name?: string;
  slug?: string;
  previousPrice?: number;
  currentPrice?: number;
  description?: string;
  status?: ProductStatus;
  badge?: ProductBadge;
  categoryId?: string;
}

export const authService = {
  login: (credentials: { username: string; password: string }) =>
    userApi.post<
      ApiSuccess<{
        accessToken: string;
        user: Pick<
          User,
          "id" | "username" | "role" | "name" | "email" | "status"
        >;
      }>
    >("/users/login", credentials),
};

export const userService = {
  getAll: () => userApi.get<ApiSuccess<User[]>>("/users"),
  getMe: () => userApi.get<ApiSuccess<User>>("/users/me"),
  create: (payload: {
    username: string;
    password: string;
    email?: string | null;
    name?: string | null;
    role?: UserRole;
    status?: UserStatus;
  }) => userApi.post<ApiSuccess<User>>("/users", payload),
  update: (id: string, payload: UpdateUserPayload) =>
    userApi.patch<ApiSuccess<User>>(`/users/${id}`, payload),
  delete: (id: string) => userApi.delete<ApiSuccess<null>>(`/users/${id}`),
};

export const categoryService = {
  getAll: (params?: CategoryListParams) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);

    return userApi.get<ApiSuccess<PaginatedResponse<Category>>>(
      `/categories${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
    );
  },

  getManageList: (params?: CategoryListParams) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);

    return userApi.get<
      ApiSuccess<PaginatedResponse<Category & { slug: string }>>
    >(
      `/categories/manage${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
    );
  },

  create: (payload: CreateCategoryPayload) =>
    userApi.post<ApiSuccess<Category>>("/categories", payload),

  update: (id: string, payload: UpdateCategoryPayload) =>
    userApi.patch<ApiSuccess<Category>>(`/categories/${id}`, payload),

  delete: (id: string) => userApi.delete<ApiSuccess<null>>(`/categories/${id}`),
};

export const dashboardService = {
  getStats: () => userApi.get<ApiSuccess<DashboardSummary>>("/admin/dashboard"),
};

export const productService = {
  getPublicList: (params?: ProductListParams) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.categoryId) searchParams.set("categoryId", params.categoryId);
    if (params?.categorySlug)
      searchParams.set("categorySlug", params.categorySlug);
    if (params?.status) searchParams.set("status", params.status);

    return userApi.get<ApiSuccess<PaginatedResponse<Product>>>(
      `/products${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
    );
  },

  getBySlug: (slug: string) =>
    userApi.get<ApiSuccess<Product>>(`/products/${encodeURIComponent(slug)}`),

  getManageList: (params?: ProductListParams) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.categoryId) searchParams.set("categoryId", params.categoryId);
    if (params?.status) searchParams.set("status", params.status);

    return userApi.get<ApiSuccess<PaginatedResponse<Product>>>(
      `/products/manage${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
    );
  },

  create: (payload: CreateProductPayload) =>
    userApi.post<ApiSuccess<Product>>("/products", payload),

  update: (id: string, payload: UpdateProductPayload) =>
    userApi.patch<ApiSuccess<Product>>(`/products/${id}`, payload),

  delete: (id: string) => userApi.delete<ApiSuccess<null>>(`/products/${id}`),

  uploadImages: (productId: string, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("images", file));
    return userApi.post<ApiSuccess<ProductImage[]>>(
      `/products/${productId}/images/upload`,
      form,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },

  addImagesByUrl: (productId: string, urls: string[]) =>
    userApi.post<ApiSuccess<ProductImage[]>>(`/products/${productId}/images`, {
      urls,
    }),

  deleteImage: (productId: string, imageId: string) =>
    userApi.delete<ApiSuccess<null>>(
      `/products/${productId}/images/${imageId}`,
    ),
};

export interface CustomerOrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { id: string; name: string } | null;
}

export interface CustomerOrder {
  id: string;
  totalPrice: number;
  orderStatus: string;
  orderItems: CustomerOrderItem[];
  shippingAddress?: { name?: string; address?: string; city?: string } | null;
}

export interface Customer {
  id: string;
  phone?: string | null;
  email?: string | null;
  name?: string | null;
  status?: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerWithOrders extends Customer {
  orders?: CustomerOrder[];
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: UserStatus;
  from?: string;
  to?: string;
}

export interface CustomerListResponse {
  items: Customer[];
  total: number;
  page: number;
  limit: number;
}

export const customerService = {
  list: (params?: CustomerListParams) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.q) searchParams.set("q", params.q);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);

    return userApi.get<ApiSuccess<CustomerListResponse>>(
      `/admin/customers${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
    );
  },

  getById: (id: string) =>
    userApi.get<ApiSuccess<CustomerWithOrders>>(`/admin/customers/${id}`),

  deactivate: (id: string) =>
    userApi.post<ApiSuccess<null>>(`/admin/customers/${id}/deactivate`),

  reactivate: (id: string) =>
    userApi.post<ApiSuccess<Customer>>(`/admin/customers/${id}/reactivate`),
};

export type OrderStatus = "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface OrderProductRef {
  id: string;
  name: string;
  slug?: string;
  currentPrice?: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product?: OrderProductRef | null;
}

export interface ShippingAddress {
  id?: string;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  orderId?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  totalPrice: number;
  orderStatus: OrderStatus;
  paymentMethod?: string;
  customerId?: string;
  createdAt?: string;
  updatedAt?: string;
  orderItems: OrderItem[];
  shippingAddress?: ShippingAddress | null;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export interface OrderListResponse {
  items: Order[];
  pagination: { total: number; page: number; limit: number };
}

export const orderService = {
  list: (params?: OrderListParams) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);

    return userApi.get<ApiSuccess<OrderListResponse>>(
      `/admin/orders${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
    );
  },

  getById: (id: string) =>
    userApi.get<ApiSuccess<Order>>(`/admin/orders/${id}`),

  updateStatus: (id: string, status: OrderStatus) =>
    userApi.patch<ApiSuccess<{ id: string; orderStatus: OrderStatus }>>(
      `/admin/orders/${id}/status`,
      { status },
    ),

  updateShipping: (
    id: string,
    payload: { name: string; address: string; city: string; phone: string },
  ) =>
    userApi.patch<ApiSuccess<ShippingAddress>>(
      `/admin/orders/${id}/shipping`,
      payload,
    ),
};

export default api;
