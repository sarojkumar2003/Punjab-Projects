// src/pages/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";

const API_BASE = "http://localhost:5000";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "commuter", // ✅ match backend enum: 'commuter' | 'admin'
  isActive: true,
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [adminSecurityCode, setAdminSecurityCode] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const isAdminRole = form.role === "admin";

  // ------------------------------------------------------------------
  // FETCH USERS
  // ------------------------------------------------------------------
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch users");
      }

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("User fetch error:", err);
      setErrorMsg(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ------------------------------------------------------------------
  // OPEN PANEL FOR CREATE / EDIT
  // ------------------------------------------------------------------
  const openCreatePanel = () => {
    setEditingId(null);
    setForm(emptyForm);
    setAdminSecurityCode("");
    setPanelOpen(true);
    setSuccessMsg("");
    setErrorMsg("");
  };

  const openEditPanel = (user) => {
    setEditingId(user._id);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "", // keep blank; only send if admin fills it
      role: user.role || "commuter",
      isActive: user.isActive !== false,
    });
    setAdminSecurityCode("");
    setPanelOpen(true);
    setSuccessMsg("");
    setErrorMsg("");
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setAdminSecurityCode("");
  };

  // ------------------------------------------------------------------
  // HANDLE FORM CHANGE
  // ------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // If role changes away from admin, clear adminSecurityCode (no need to keep it)
    if (name === "role") {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
      if (value !== "admin") {
        setAdminSecurityCode("");
      }
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ------------------------------------------------------------------
  // SUBMIT (CREATE / UPDATE)
  // ------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    if (!form.name.trim() || !form.email.trim()) {
      setErrorMsg("Name and email are required.");
      return;
    }

    // ✅ Only require adminSecurityCode when the user is admin
    if (isAdminRole && !adminSecurityCode.trim()) {
      setErrorMsg(
        "Admin security code is required when creating or updating an Admin user."
      );
      return;
    }

    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      isActive: form.isActive,
    };

    // Only send password if creating OR admin typed something
    if (!editingId || form.password.trim()) {
      body.password = form.password.trim();
    }

    // Only send adminSecurityCode if role is admin
    if (isAdminRole) {
      body.adminSecurityCode = adminSecurityCode.trim();
    }

    const token = localStorage.getItem("token");

    try {
      const url = editingId
        ? `${API_BASE}/api/admin/users/${editingId}`
        : `${API_BASE}/api/admin/users`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save user");
      }

      setSuccessMsg(
        editingId ? "User updated successfully." : "User created successfully."
      );
      closePanel();
      fetchUsers();
    } catch (err) {
      console.error("Save user error:", err);
      setErrorMsg(err.message || "Failed to save user");
    }
  };

  // ------------------------------------------------------------------
  // TOGGLE USER STATUS (Active / Disabled)
  // ------------------------------------------------------------------
  const handleToggleStatus = async (user) => {
    setErrorMsg("");
    setSuccessMsg("");

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMsg("You are not authenticated. Please log in again.");
      return;
    }

    const currentActive = user.isActive !== false;
    const newStatus = !currentActive;

    const body = { isActive: newStatus };

    // If the target user is an admin, ask for admin security code
    if (user.role === "admin") {
      const code = window.prompt(
        `Enter admin security code to change status for Admin "${user.name}" :`
      );
      if (!code) return;
      body.adminSecurityCode = code.trim();
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update user status");
      }

      // ✅ Optimistically update local UI so badge flips immediately
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, isActive: newStatus } : u
        )
      );

      setSuccessMsg(
        `User "${user.name}" status updated to ${
          newStatus ? "Active" : "Disabled"
        }.`
      );
      // If you want to be 100% synced with backend, you can still:
      // fetchUsers();
    } catch (err) {
      console.error("Toggle status error:", err);
      setErrorMsg(err.message || "Failed to update user status");
    }
  };

  // ------------------------------------------------------------------
  // DELETE USER (still requires adminSecurityCode prompt)
  // ------------------------------------------------------------------
  const handleDelete = async (user) => {
    const token = localStorage.getItem("token");
    const code = window.prompt(
      `Enter admin security code to delete user "${user.name}" :`
    );
    if (!code) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          adminSecurityCode: code.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete user");
      }

      setSuccessMsg("User deleted successfully.");
      fetchUsers();
    } catch (err) {
      console.error("Delete user error:", err);
      setErrorMsg(err.message || "Failed to delete user");
    }
  };

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <AdminLayout>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
              User Management
            </h1>
            <p className="text-xs text-slate-400">
              Create, update and manage users. Admin users require an additional
              security code. Click the status badge to quickly enable or disable a user.
            </p>
          </div>
          <button
            onClick={openCreatePanel}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-600"
          >
            <span>＋</span>
            <span>New User</span>
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="rounded-lg border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
            {successMsg}
          </div>
        )}

        {/* Users Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
          <div className="border-b border-slate-800 px-4 py-2 text-xs text-slate-400 flex justify-between">
            <span>{users.length} user(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-6 text-center text-slate-500"
                    >
                      Loading users…
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-6 text-center text-slate-500"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isActive = u.isActive !== false;
                    return (
                      <tr
                        key={u._id}
                        className="border-b border-slate-800/80 hover:bg-slate-900/70"
                      >
                        <td className="px-4 py-2 text-slate-100">{u.name}</td>
                        <td className="px-4 py-2 text-slate-300">{u.email}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                              u.role === "admin"
                                ? "bg-amber-500/10 text-amber-200 border border-amber-500/40"
                                : "bg-slate-700/40 text-slate-200 border border-slate-600/60"
                            }`}
                          >
                            {u.role === "admin" ? "Admin" : "Commuter"}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {/* 🔄 Clickable status badge */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] transition border ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/50 hover:bg-emerald-500/20"
                                : "bg-slate-700/40 text-slate-300 border-slate-600/60 hover:bg-slate-700/70"
                            }`}
                            title="Click to toggle status"
                          >
                            {isActive ? "Active" : "Disabled"}
                          </button>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditPanel(u)}
                              className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-indigo-500 hover:text-indigo-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(u)}
                              className="rounded-lg border border-rose-600/60 px-2 py-1 text-[11px] text-rose-200 hover:bg-rose-600/20"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slide-over panel for create / edit */}
        {panelOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-end bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md h-full bg-slate-950 border-l border-slate-800 flex flex-col">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-50">
                    {editingId ? "Edit User" : "Create User"}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Admin security code is required only when saving Admin users.
                  </p>
                </div>
                <button
                  onClick={closePanel}
                  className="text-slate-400 hover:text-slate-100 text-lg"
                >
                  ✕
                </button>
              </div>

              <form
                className="flex-1 overflow-auto px-4 py-4 space-y-4 text-xs"
                onSubmit={handleSubmit}
              >
                <div>
                  <label className="block mb-1 text-slate-300">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-300">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-300">
                    {editingId ? "New Password (optional)" : "Password"}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
                    placeholder={editingId ? "Leave blank to keep existing" : ""}
                    autoComplete="new-password"
                    {...(!editingId ? { required: true } : {})}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-300">Role</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  >
                    <option value="commuter">Commuter</option>
                    <option value="admin">Admin</option>
                  </select>
                  {form.role === "admin" && (
                    <p className="mt-1 text-[10px] text-amber-300">
                      Giving the Admin role grants full access. Make sure you trust
                      this account.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="h-3 w-3 rounded border-slate-600 bg-slate-900 text-indigo-500"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-slate-300 text-xs cursor-pointer"
                  >
                    Active account
                  </label>
                </div>

                {/* 🔐 Admin security code – only shown when role is admin */}
                {isAdminRole && (
                  <div className="pt-2 border-t border-slate-800">
                    <label className="block mb-1 text-slate-300">
                      Admin Security Code
                    </label>
                    <input
                      type="password"
                      value={adminSecurityCode}
                      onChange={(e) => setAdminSecurityCode(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none focus:border-rose-500"
                      placeholder="Enter master admin security code"
                      required={isAdminRole}
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      Required only when creating or updating Admin users.
                    </p>
                  </div>
                )}

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-800/70">
                  <button
                    type="button"
                    onClick={closePanel}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-[11px] text-slate-200 hover:bg-slate-800/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-500 px-4 py-2 text-[11px] font-semibold text-white hover:bg-indigo-600"
                  >
                    {editingId ? "Save Changes" : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
