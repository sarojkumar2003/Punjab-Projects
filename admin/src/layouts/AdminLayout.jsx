// src/layouts/AdminLayout.jsx
import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/admin/dashboard", icon: "📊" },
  { label: "Buses", to: "/admin/buses", icon: "🚌" },
  { label: "Routes", to: "/admin/routes", icon: "🗺️" },
  { label: "Live Routes", to: "/admin/live-routes", icon: "📡" },
  { label: "Drivers", to: "/admin/drivers", icon: "👨‍✈️" },
  { label: "Users", to: "/admin/users", icon: "👥" },
];

// Small helper to capitalize: "john" -> "John"
const capitalize = (str = "") =>
  str.length ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

// Build a nice display name from stored name / email
const getAdminDisplayName = () => {
  const rawName = localStorage.getItem("adminName");
  const rawEmail =
    localStorage.getItem("adminEmail") || localStorage.getItem("email");

  if (rawName && rawName.trim()) {
    return rawName.trim();
  }

  if (rawEmail && rawEmail.trim()) {
    const localPart = rawEmail.split("@")[0];
    // john.doe-singh → ["john","doe","singh"] → "John Doe Singh"
    const parts = localPart.split(/[._-]+/).filter(Boolean);
    if (parts.length) {
      return parts.map(capitalize).join(" ");
    }
    return localPart;
  }

  return "Admin";
};

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const displayName = getAdminDisplayName();
  const firstName = displayName.split(" ")[0] || "Admin";
  const initial = firstName.charAt(0).toUpperCase() || "A";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("email");
    window.location.href = "/admin/login";
  };

  const currentNav =
    navItems.find((n) => location.pathname.startsWith(n.to)) || navItems[0];

  const renderNavLinks = (onClickItem) => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onClickItem}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
              isActive
                ? "bg-indigo-500/20 text-indigo-100 border border-indigo-500/60 shadow-sm shadow-indigo-500/20"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
            }`
          }
        >
          <span className="text-lg">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/90">
        <div className="h-16 flex items-center px-5 border-b border-slate-800/80">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200 text-xl shadow-sm shadow-indigo-500/40">
              🚍
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">
                Punjab Commute
              </p>
              <p className="text-[11px] text-slate-400 uppercase tracking-wide">
                Admin Panel
              </p>
            </div>
          </Link>
        </div>

        {renderNavLinks()}

        {/* Logged-in admin info */}
        <div className="px-4 py-4 border-t border-slate-800/80 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center text-[11px] font-bold text-slate-950">
              {initial}
            </div>
            <div className="flex flex-col">
              <span className="text-slate-200">{displayName}</span>
              <span className="text-[10px] text-emerald-300 flex items-center gap-1">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-3 inline-flex items-center gap-1 text-rose-400 hover:text-rose-300"
          >
            <span>⎋</span> <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-950 border-r border-slate-800 transition-transform duration-200 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center px-5 border-b border-slate-800">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-2"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200 text-xl">
              🚍
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">
                Punjab Commute
              </p>
              <p className="text-[11px] text-slate-400 uppercase tracking-wide">
                Admin Panel
              </p>
            </div>
          </Link>
        </div>

        {renderNavLinks(() => setSidebarOpen(false))}

        <div className="px-4 py-4 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center text-[11px] font-bold text-slate-950">
              {initial}
            </div>
            <span className="text-slate-200">{displayName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300"
          >
            <span>⎋</span> <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/70 backdrop-blur flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <button
              className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <span className="sr-only">Toggle navigation</span>
              ☰
            </button>

            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wide text-slate-500">
                Admin Console
              </span>
              <span className="text-sm font-semibold text-slate-100">
                {currentNav.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[11px] text-slate-400">
                Welcome back,
              </span>
              <span className="text-xs font-medium text-slate-100">
                {firstName}
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center text-xs font-bold">
              {initial}
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-4 md:p-6 bg-slate-950 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
