import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store";
import { userService, UserRole, UserStatus, User } from "../services/api";
import { Plus, Edit, Trash2, X, Check, RefreshCw, Search } from "lucide-react";

const parseApiError = (error: any) =>
  error?.response?.data?.error?.message ||
  error?.response?.data?.message ||
  "Request failed. Please try again.";

export const Users = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<User | null>(null);
  const [loadingAction, setLoadingAction] = useState<
    "create" | "update" | "delete" | "fetch" | null
  >(null);

  const [createForm, setCreateForm] = useState({
    username: "",
    password: "",
    email: "",
    name: "",
    role: "MODERATOR" as UserRole,
    status: "ACTIVE" as UserStatus,
  });

  const [editForm, setEditForm] = useState({
    id: "",
    username: "",
    password: "",
    email: "",
    name: "",
    role: "" as "" | UserRole,
    status: "" as "" | UserStatus,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingAction("fetch");
    try {
      const res = await userService.getAll();
      setUsers(res.data.data);
      setError("");
    } catch (err: any) {
      setError(parseApiError(err));
    } finally {
      setLoadingAction(null);
      setLoading(false);
    }
  };

  const resetAlerts = () => {
    setError("");
    setMessage("");
  };

  const resetCreateForm = () => {
    setCreateForm({
      username: "",
      password: "",
      email: "",
      name: "",
      role: "MODERATOR",
      status: "ACTIVE",
    });
  };

  const resetEditForm = () => {
    setEditForm({
      id: "",
      username: "",
      password: "",
      email: "",
      name: "",
      role: "",
      status: "",
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAlerts();

    if (!isAdmin) {
      setError("Only ADMIN can create users.");
      return;
    }

    setLoadingAction("create");
    try {
      await userService.create({
        username: createForm.username,
        password: createForm.password,
        email: createForm.email || null,
        name: createForm.name || null,
        role: createForm.role,
        status: createForm.status,
      });
      setMessage("User created successfully");
      resetCreateForm();
      setShowCreateModal(false);
      fetchUsers();
    } catch (err: any) {
      setError(parseApiError(err));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEdit = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setEditForm({
      id: userToEdit.id,
      username: userToEdit.username,
      password: "",
      email: userToEdit.email || "",
      name: userToEdit.name || "",
      role: userToEdit.role,
      status: userToEdit.status,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAlerts();

    const payload: Record<string, string> = {};
    if (editForm.username.trim() && editForm.username !== editingUser?.username)
      payload.username = editForm.username.trim();
    if (editForm.password.trim()) payload.password = editForm.password.trim();
    if (editForm.email.trim() && editForm.email !== editingUser?.email)
      payload.email = editForm.email.trim();
    if (editForm.name.trim() && editForm.name !== editingUser?.name)
      payload.name = editForm.name.trim();
    if (editForm.role && editForm.role !== editingUser?.role)
      payload.role = editForm.role;
    if (editForm.status && editForm.status !== editingUser?.status)
      payload.status = editForm.status;

    if (!Object.keys(payload).length) {
      setError("No changes detected.");
      return;
    }

    if (!isAdmin && user?.id && editForm.id !== user.id) {
      setError("You can only update your own user.");
      return;
    }

    setLoadingAction("update");
    try {
      await userService.update(editForm.id, payload);
      setMessage("User updated successfully");
      setEditingUser(null);
      resetEditForm();
      fetchUsers();
    } catch (err: any) {
      setError(parseApiError(err));
    } finally {
      setLoadingAction(null);
    }
  };

  const requestDelete = (userToDelete: User) => {
    resetAlerts();

    if (!isAdmin) {
      setError("Only ADMIN can delete users.");
      return;
    }

    setDeleteCandidate(userToDelete);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;

    resetAlerts();
    setLoadingAction("delete");
    try {
      await userService.delete(deleteCandidate.id);
      setMessage("User deleted successfully");
      setDeleteCandidate(null);
      fetchUsers();
    } catch (err: any) {
      setError(parseApiError(err));
    } finally {
      setLoadingAction(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-slate-500 text-sm">
            Manage admin and moderator accounts
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            Add User
          </button>
        )}
      </div>

      {/* Alerts */}
      {(message || error) && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            error
              ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{error || message}</span>
            <button
              onClick={resetAlerts}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <button
          onClick={fetchUsers}
          disabled={loadingAction === "fetch"}
          className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <RefreshCw
            size={16}
            className={loadingAction === "fetch" ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw
              className="animate-spin mx-auto mb-4 text-slate-400"
              size={24}
            />
            <p className="text-slate-500">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                    User
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                    Role
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                    Created
                  </th>
                  {isAdmin && (
                    <th className="text-right px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredUsers.map((userItem) => (
                  <tr
                    key={userItem.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                          {userItem.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {userItem.name || userItem.username}
                          </div>
                          <div className="text-sm text-slate-500">
                            {userItem.email || userItem.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          userItem.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        }`}
                      >
                        {userItem.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          userItem.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400"
                        }`}
                      >
                        {userItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(userItem.createdAt).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(userItem)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => requestDelete(userItem)}
                            disabled={loadingAction === "delete"}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold">Create New User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <input
                required
                value={createForm.username}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, username: e.target.value }))
                }
                placeholder="Username"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                required
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, password: e.target.value }))
                }
                placeholder="Password"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, email: e.target.value }))
                }
                placeholder="Email (optional)"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="Full Name (optional)"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm((s) => ({
                      ...s,
                      role: e.target.value as UserRole,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="MODERATOR">MODERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <select
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm((s) => ({
                      ...s,
                      status: e.target.value as UserStatus,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-slate-600 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === "create"}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-60 transition-colors"
                >
                  {loadingAction === "create" ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold">Edit User</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <input
                value={editForm.username}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, username: e.target.value }))
                }
                placeholder="Username"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="password"
                value={editForm.password}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, password: e.target.value }))
                }
                placeholder="New Password (leave empty to keep current)"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, email: e.target.value }))
                }
                placeholder="Email"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="Full Name"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm((s) => ({
                      ...s,
                      role: e.target.value as "" | UserRole,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="MODERATOR">MODERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((s) => ({
                      ...s,
                      status: e.target.value as "" | UserStatus,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2 text-slate-600 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === "update"}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-60 transition-colors"
                >
                  {loadingAction === "update" ? "Updating..." : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold">Delete User</h2>
              <button
                onClick={() => setDeleteCandidate(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Are you sure you want to delete
                <span className="font-semibold">
                  {" "}
                  {deleteCandidate.username}
                </span>
                ?
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteCandidate(null)}
                  className="flex-1 px-4 py-2 text-slate-600 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={loadingAction === "delete"}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg disabled:opacity-60 transition-colors"
                >
                  {loadingAction === "delete" ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
