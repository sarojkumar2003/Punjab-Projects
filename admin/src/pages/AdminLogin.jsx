import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminAuthLayout from "../components/AdminAuthLayout";

// FIXED: match backend route
// const API = "http://localhost:5000/api/auth/admin/login";
const API = "https://punjab-projects.onrender.com/api/auth/admin/login";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [type, setType] = useState("error");
  const [loading, setLoading] = useState(false);

  // Auto-hide message
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
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // keep this, since backend uses cookies
        body: JSON.stringify({ email, password, adminKey }),
      });

      const data = await res.json();
      console.log("Admin login response:", res.status, data);

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.token) localStorage.setItem("token", data.token);
      if (data.role) localStorage.setItem("role", data.role);

      setType("success");
      setMsg("Admin login successful. Redirecting to dashboard…");
      setTimeout(() => {
        window.location.href = "/admin/dashboard";
      }, 900);
    } catch (err) {
      setType("error");
      setMsg(err.message || "Something went wrong while logging in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toast */}
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-200">
                Password
              </label>
            </div>
            <input
              type="password"
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 transition"
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
