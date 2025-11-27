// src/pages/AdminDrivers.jsx
import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");
  const [savingId, setSavingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    shift: "Morning",
    isActive: true,
  });

  const token = useMemo(() => localStorage.getItem("token"), []);

  const showMessage = (text, type = "info") => {
    setMsg(text);
    setMsgType(type);
    if (text) {
      setTimeout(() => setMsg(""), 4000);
    }
  };

  const authHeaders = token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : { "Content-Type": "application/json" };

  const fetchData = async () => {
    try {
      setLoading(true);
      setMsg("");

      const [driverRes, busRes] = await Promise.all([
        fetch(`${API_BASE}/api/drivers`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }),
        fetch(`${API_BASE}/api/bus`),
      ]);

      const [driverData, busData] = await Promise.all([
        driverRes.json(),
        busRes.json(),
      ]);

      if (!driverRes.ok)
        throw new Error(driverData.message || "Failed to fetch drivers");
      if (!busRes.ok)
        throw new Error(busData.message || "Failed to fetch buses");

      setDrivers(Array.isArray(driverData) ? driverData : []);
      setBuses(Array.isArray(busData) ? busData : []);
    } catch (err) {
      console.error("Fetch drivers/buses error:", err);
      showMessage(err.message || "Error loading driver data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    try {
      if (!form.name || !form.phone) {
        showMessage("Name and phone are required", "error");
        return;
      }

      const res = await fetch(`${API_BASE}/api/drivers`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create driver");

      showMessage("Driver created successfully", "success");
      setForm({
        name: "",
        phone: "",
        shift: "Morning",
        isActive: true,
      });
      fetchData();
    } catch (err) {
      console.error("Create driver error:", err);
      showMessage(err.message || "Error creating driver", "error");
    }
  };

  const handleAssignBus = async (driverId, busId) => {
    try {
      setSavingId(driverId);
      const res = await fetch(`${API_BASE}/api/drivers/assign`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ driverId, busId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to assign driver");

      showMessage("Driver assigned to bus", "success");
      fetchData();
    } catch (err) {
      console.error("Assign driver error:", err);
      showMessage(err.message || "Error assigning driver", "error");
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActive = async (driver) => {
    try {
      setSavingId(driver._id);
      const res = await fetch(`${API_BASE}/api/drivers/${driver._id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ isActive: !driver.isActive }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update driver");

      setDrivers((prev) =>
        prev.map((d) => (d._id === driver._id ? data : d))
      );
    } catch (err) {
      console.error("Toggle active error:", err);
      showMessage(err.message || "Error updating driver status", "error");
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteDriver = async (id) => {
    if (!window.confirm("Delete this driver?")) return;
    try {
      setSavingId(id);
      const res = await fetch(`${API_BASE}/api/drivers/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete driver");

      showMessage("Driver deleted", "success");
      setDrivers((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      console.error("Delete driver error:", err);
      showMessage(err.message || "Error deleting driver", "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Driver Management
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Store driver information, assign them to buses and manage their status.
            </p>
          </div>
        </div>

        {msg && (
          <div
            className={`rounded-xl border px-4 py-2 text-sm ${
              msgType === "error"
                ? "border-rose-500/60 bg-rose-500/10 text-rose-100"
                : msgType === "success"
                ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-100"
                : "border-sky-500/60 bg-sky-500/10 text-sky-100"
            }`}
          >
            {msg}
          </div>
        )}

        {/* Create Driver Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">
            Add New Driver
          </h2>
          <form
            onSubmit={handleCreateDriver}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm"
          >
            <input
              type="text"
              placeholder="Driver Name"
              className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-50 placeholder-slate-500"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />

            <input
              type="text"
              placeholder="Phone Number"
              className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-50 placeholder-slate-500"
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              required
            />

            <select
              className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-50"
              value={form.shift}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, shift: e.target.value }))
              }
            >
              <option value="Morning">Morning Shift</option>
              <option value="Evening">Evening Shift</option>
              <option value="Night">Night Shift</option>
            </select>

            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                }
              />
              <label
                htmlFor="isActive"
                className="text-xs text-slate-300 select-none"
              >
                Active driver
              </label>
            </div>

            <button
              type="submit"
              className="md:col-span-4 mt-1 inline-flex justify-center rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600"
            >
              Save Driver
            </button>
          </form>
        </div>

        {/* Drivers Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 overflow-x-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-100">
              All Drivers
            </h2>
            <span className="text-[11px] text-slate-500">
              {drivers.length} driver(s)
            </span>
          </div>

          <table className="min-w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="text-left py-2 pr-3">Name</th>
                <th className="text-left py-2 pr-3">Phone</th>
                <th className="text-left py-2 pr-3">Shift</th>
                <th className="text-left py-2 pr-3">Assigned Bus</th>
                <th className="text-left py-2 pr-3">Status</th>
                <th className="text-left py-2 pr-3">Created</th>
                <th className="text-right py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-500">
                    Loading drivers…
                  </td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-500">
                    No drivers found. Use the form above to add one.
                  </td>
                </tr>
              ) : (
                drivers.map((d, idx) => (
                  <tr
                    key={d._id}
                    className={`border-b border-slate-800/60 ${
                      idx % 2 === 0 ? "bg-slate-900/40" : ""
                    }`}
                  >
                    <td className="py-2 pr-3 text-slate-100">{d.name}</td>
                    <td className="py-2 pr-3 text-slate-300">{d.phone}</td>
                    <td className="py-2 pr-3 text-slate-300">{d.shift}</td>
                    <td className="py-2 pr-3 text-slate-300">
                      <select
                        className="rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-50"
                        value={d.assignedBus?._id || ""}
                        onChange={(e) =>
                          handleAssignBus(d._id, e.target.value || null)
                        }
                        disabled={savingId === d._id}
                      >
                        <option value="">
                          {d.assignedBus?.busNumber || "Unassigned"}
                        </option>
                        {buses.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.busNumber} ({b.route?.routeName || "No route"})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(d)}
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                          d.isActive
                            ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-100"
                            : "border-slate-600 bg-slate-800 text-slate-200"
                        }`}
                        disabled={savingId === d._id}
                      >
                        {d.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-2 pr-3 text-slate-400">
                      {d.createdAt
                        ? new Date(d.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-2 pr-3 text-right space-x-2">
                      <button
                        onClick={() => handleDeleteDriver(d._id)}
                        className="text-xs text-rose-400 hover:text-rose-300"
                        disabled={savingId === d._id}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDrivers;
