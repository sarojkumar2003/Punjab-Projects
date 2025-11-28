import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminAuthLayout from "../components/AdminAuthLayout";

// Use env-based API base (works for localhost + production)
const API_BASE = import.meta.env.VITE_API_BASE;
const API = `${API_BASE}/api/auth/admin/register`;

const AdminSignup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [type, setType] = useState("error");
  const [loading, setLoading] = useState(false);

  // Auto-hide message after a few seconds
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  const submitSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        adminKey: adminKey.trim(),
        password, // let backend handle password rules
      };

      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // harmless if backend doesn't set cookies
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data.message || "Signup failed");
      }

      setType("success");
      setMsg("Admin account created. Redirecting to login…");

      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 900);
    } catch (err) {
      setType("error");
      setMsg(err.message || "Something went wrong while creating admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toast (top-right) */}
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
        title="Create Admin Account"
        description="Only authorized transport authority personnel should create admin accounts."
      >
        {/* Inline message inside card */}
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

        <form onSubmit={submitSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200">
              Full name
            </label>
            <input
              type="text"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 transition"
              placeholder="e.g. Transport Officer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200">
              Official email
            </label>
            <input
              type="email"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 transition"
              placeholder="name@punjabtransport.gov.in"
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
              placeholder="Provided by system administrator"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              required
            />
            <p className="mt-1 text-[11px] text-slate-500">
              This key is required to prevent unauthorized admin creation.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200">
              Password
            </label>
            <input
              type="password"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 transition"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 inline-flex items-center justify-center rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm py-2.5 shadow-lg shadow-indigo-500/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating admin…" : "Create Admin Account"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400">
          Already have admin access?{" "}
          <Link
            to="/admin/login"
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Sign in here
          </Link>
        </p>
      </AdminAuthLayout>
    </>
  );
};

export default AdminSignup;
