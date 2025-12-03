// src/pages/AdminLogin.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminAuthLayout from "../components/AdminAuthLayout";

// Use ONLY local backend
const API_BASE = "http://localhost:5000";
const LOGIN_ENDPOINT = `${API_BASE}/api/auth/admin/login`;

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [type, setType] = useState("error"); // "error" | "success"
  const [loading, setLoading] = useState(false);

  // Auto-hide toast
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  const submitLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, adminKey }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          data?.message ||
          (res.status === 401
            ? "Invalid email, password, or admin key"
            : "Login failed. Please try again.");
        throw new Error(message);
      }

      if (data.token) localStorage.setItem("token", data.token);
      if (data.role) localStorage.setItem("role", data.role);

      setType("success");
      setMsg("Login successful. Redirecting…");

      setTimeout(() => {
        window.location.href = "/admin/dashboard";
      }, 800);
    } catch (err) {
      setType("error");
      setMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating toast */}
      {msg && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg text-sm border backdrop-blur-md ${
              type === "success"
                ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-200"
                : "bg-rose-500/15 border-rose-500/50 text-rose-200"
            }`}
          >
            {msg}
          </div>
        </div>
      )}

      <AdminAuthLayout
        title="Admin Sign In"
        description="Use your official admin credentials and secret key to access the control panel."
      >
        {/* Inline message in card */}
        {msg && (
          <div
            className={`mb-4 text-sm rounded-xl px-3 py-2 border ${
              type === "success"
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/50 bg-rose-500/10 text-rose-300"
            }`}
          >
            {msg}
          </div>
        )}

        <form onSubmit={submitLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200">
              Admin email
            </label>
            <input
              type="email"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 transition"
              placeholder="admin@punjabtransport.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200">
              Admin secret key
            </label>
            <input
              type="password"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 transition"
              placeholder="Enter admin secret key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200">
              Password
            </label>
            <input
              type="password"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 transition"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm py-2.5 shadow-lg shadow-indigo-500/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign in as Admin"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400">
          Need an admin account?{" "}
          <Link
            to="/admin/signup"
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Create admin access
          </Link>
        </p>
      </AdminAuthLayout>
    </>
  );
};

export default AdminLogin;
