import React from "react";
import { Link } from "react-router-dom";

const AdminAuthLayout = ({ title, description, children }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/60 shadow-[0_18px_45px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        {/* Left panel – branding */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 p-8 text-white relative">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              Punjab Commute · Admin
            </div>

            <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight drop-shadow-sm">
              Real-Time Public Transport Control Panel
            </h1>
            <p className="mt-3 text-sm text-slate-100/90 max-w-xs">
              Secure admin access to manage routes, buses and live operations
              across small cities in Punjab.
            </p>
          </div>

          <div className="mt-10 space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">
                📊
              </span>
              <p>Monitor fleet performance and route efficiency in one place.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">
                🛰
              </span>
              <p>View live GPS positions of buses across multiple corridors.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">
                🛡
              </span>
              <p>Role-based secure access for transport authority officials.</p>
            </div>
          </div>

          <p className="mt-6 text-[11px] text-slate-100/75">
            Department of Higher Education · Government of Punjab
          </p>

          <div className="pointer-events-none absolute -bottom-24 -right-20 h-44 w-44 rounded-full bg-white/35 blur-3xl opacity-70" />
        </div>

        {/* Right panel – auth card */}
        <div className="bg-slate-950/80 text-slate-50 px-6 py-8 sm:px-8 md:px-10 flex flex-col justify-center">
          <div className="mb-7">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-100"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300 text-lg">
                🚍
              </span>
              <span className="font-semibold tracking-[0.16em] uppercase text-[11px]">
                Punjab Commute Admin
              </span>
            </Link>

            <h2 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-sm text-slate-400">{description}</p>
            )}
          </div>

          <div>{children}</div>

          <p className="mt-6 text-[11px] text-slate-500">
            For authorized transport authority staff only. All access is logged.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthLayout;
