// src/pages/ManageBuses.jsx
import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "../layouts/AdminLayout";

// const API_BASE = "http://localhost:5000";
const API_BASE = import.meta.env.VITE_API_BASE;

const ManageBuses = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");

  // create bus form
  const [form, setForm] = useState({
    busNumber: "",
    routeId: "",
    lng: "",
    lat: "",
    status: "On Time",
    driverName: "",
    driverPhone: "",
  });

  // quick edit selected bus
  const [selectedBus, setSelectedBus] = useState(null);
  const [editLocation, setEditLocation] = useState({ lng: "", lat: "" });
  const [editStatus, setEditStatus] = useState("On Time");

  const token = useMemo(() => localStorage.getItem("token"), []);

  const showMessage = (text, type = "info") => {
    setMsg(text);
    setMsgType(type);
    if (text) {
      setTimeout(() => setMsg(""), 4000);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setMsg("");

      const [busRes, routeRes] = await Promise.all([
        fetch(`${API_BASE}/api/bus`),
        fetch(`${API_BASE}/api/routes`),
      ]);

      const [busData, routeData] = await Promise.all([
        busRes.json(),
        routeRes.json(),
      ]);

      if (!busRes.ok) throw new Error(busData.message || "Failed to fetch buses");
      if (!routeRes.ok)
        throw new Error(routeData.message || "Failed to fetch routes");

      setBuses(Array.isArray(busData) ? busData : []);
      setRoutes(Array.isArray(routeData) ? routeData : []);
    } catch (err) {
      console.error("Fetch error:", err);
      showMessage(err.message || "Failed to load buses/routes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create new bus
  const handleCreateBus = async (e) => {
    e.preventDefault();
    try {
      showMessage("");
      if (!form.routeId) {
        showMessage("Please select a route", "error");
        return;
      }
      if (!form.lng || !form.lat) {
        showMessage("Please enter coordinates (lng, lat)", "error");
        return;
      }

      const coordinates = [parseFloat(form.lng), parseFloat(form.lat)];
      const body = {
        busNumber: form.busNumber,
        route: form.routeId,
        coordinates,
        status: form.status,
        driverName: form.driverName || undefined,
        driverPhone: form.driverPhone || undefined,
      };

      const res = await fetch(`${API_BASE}/api/bus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create bus");

      showMessage("Bus created successfully", "success");
      setForm({
        busNumber: "",
        routeId: "",
        lng: "",
        lat: "",
        status: "On Time",
        driverName: "",
        driverPhone: "",
      });
      fetchData();
    } catch (err) {
      console.error("Create bus error:", err);
      showMessage(err.message || "Error creating bus", "error");
    }
  };

  // Select bus for quick update
  const handleSelectBus = (bus) => {
    setSelectedBus(bus);
    const coords = bus.currentLocation?.coordinates || [];
    setEditLocation({
      lng: coords[0] ?? "",
      lat: coords[1] ?? "",
    });
    setEditStatus(bus.status || "On Time");
  };

  const handleQuickUpdate = async (e) => {
    e.preventDefault();
    if (!selectedBus) return;
    try {
      showMessage("");

      const updates = [];
      const id = selectedBus._id;

      // Update location
      if (editLocation.lng && editLocation.lat) {
        const coordinates = [
          parseFloat(editLocation.lng),
          parseFloat(editLocation.lat),
        ];

        updates.push(
          fetch(`${API_BASE}/api/bus/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({ coordinates }),
          })
        );
      }

      // Update status
      if (editStatus) {
        updates.push(
          fetch(`${API_BASE}/api/bus/${id}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({ status: editStatus }),
          })
        );
      }

      const responses = await Promise.all(updates);
      for (const res of responses) {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to update bus");
        }
      }

      showMessage("Bus updated successfully", "success");
      setSelectedBus(null);
      fetchData();
    } catch (err) {
      console.error("Quick update error:", err);
      showMessage(err.message || "Error updating bus", "error");
    }
  };

  const handleDeleteBus = async (id) => {
    if (!window.confirm("Delete this bus?")) return;
    try {
      showMessage("");
      const res = await fetch(`${API_BASE}/api/bus/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete bus");
      showMessage("Bus deleted", "success");
      if (selectedBus && selectedBus._id === id) setSelectedBus(null);
      fetchData();
    } catch (err) {
      console.error("Delete bus error:", err);
      showMessage(err.message || "Error deleting bus", "error");
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Manage Buses
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Create, monitor and update all buses in the network.
            </p>
          </div>
        </div>

        {/* Message */}
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

        {/* Create Bus Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">
            Add New Bus
          </h2>
          <form
            onSubmit={handleCreateBus}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm"
          >
            <input
              type="text"
              placeholder="Bus Number"
              className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-50 placeholder-slate-500"
              value={form.busNumber}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, busNumber: e.target.value }))
              }
              required
            />

            <select
              className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-50"
              value={form.routeId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, routeId: e.target.value }))
              }
              required
            >
              <option value="">Select Route</option>
              {routes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.routeName}
                </option>
              ))}
            </select>

            <select
              className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-50"
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              {["On Time", "Running", "Delayed", "Arrived", "Inactive"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.000001"
              placeholder="Longitude"
              className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-50 placeholder-slate-500"
              value={form.lng}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, lng: e.target.value }))
              }
              required
            />

            <input
              type="number"
              step="0.000001"
              placeholder="Latitude"
              className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-50 placeholder-slate-500"
              value={form.lat}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, lat: e.target.value }))
              }
              required
            />

            <input
              type="text"
              placeholder="Driver Name (optional)"
              className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-50 placeholder-slate-500"
              value={form.driverName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, driverName: e.target.value }))
              }
            />

            <input
              type="text"
              placeholder="Driver Phone (optional)"
              className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-50 placeholder-slate-500"
              value={form.driverPhone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, driverPhone: e.target.value }))
              }
            />

            <button
              type="submit"
              className="md:col-span-3 mt-1 inline-flex justify-center rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600"
            >
              Create Bus
            </button>
          </form>
        </div>

        {/* Buses Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 overflow-x-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-100">
              All Buses
            </h2>
            <span className="text-[11px] text-slate-500">
              {buses.length} bus(es)
            </span>
          </div>
          <table className="min-w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="text-left py-2 pr-3">Bus</th>
                <th className="text-left py-2 pr-3">Route</th>
                <th className="text-left py-2 pr-3">Driver</th>
                <th className="text-left py-2 pr-3">Status</th>
                <th className="text-left py-2 pr-3">Location</th>
                <th className="text-left py-2 pr-3">Last Updated</th>
                <th className="text-right py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-500">
                    Loading buses…
                  </td>
                </tr>
              ) : buses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-500">
                    No buses found. Use the form above to add one.
                  </td>
                </tr>
              ) : (
                buses.map((b, idx) => {
                  const coords = b.currentLocation?.coordinates || [];
                  return (
                    <tr
                      key={b._id}
                      className={`border-b border-slate-800/60 ${
                        idx % 2 === 0 ? "bg-slate-900/40" : ""
                      }`}
                    >
                      <td className="py-2 pr-3 font-medium text-slate-50">
                        {b.busNumber}
                      </td>
                      <td className="py-2 pr-3 text-slate-200">
                        {b.route?.routeName || "—"}
                      </td>
                      <td className="py-2 pr-3 text-slate-300">
                        {b.driverName ? (
                          <>
                            {b.driverName}
                            {b.driverPhone && (
                              <span className="text-slate-500 text-[11px] block">
                                {b.driverPhone}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-500">No driver</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                            (b.status || "").toLowerCase() === "delayed"
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/40"
                              : (b.status || "").toLowerCase() === "running" ||
                                (b.status || "").toLowerCase() === "on time"
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                              : "bg-slate-700/60 text-slate-200 border border-slate-600"
                          }`}
                        >
                          {b.status || "Unknown"}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-slate-300">
                        {coords.length === 2 ? (
                          <>
                            [{coords[0].toFixed(4)}, {coords[1].toFixed(4)}]
                          </>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-slate-400">
                        {b.lastUpdated ? new Date(b.lastUpdated).toLocaleString() : "—"}
                      </td>
                      <td className="py-2 pr-3 text-right space-x-2">
                        <button
                          onClick={() => handleSelectBus(b)}
                          className="text-xs text-sky-300 hover:text-sky-200"
                        >
                          Quick edit
                        </button>
                        <button
                          onClick={() => handleDeleteBus(b._id)}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Update Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-100">
              Quick Update Bus
            </h2>
            {selectedBus && (
              <button
                onClick={() => setSelectedBus(null)}
                className="text-[11px] text-slate-400 hover:text-slate-200"
              >
                Clear selection
              </button>
            )}
          </div>
          {!selectedBus ? (
            <p className="text-xs text-slate-500">
              Select a bus from the table above to update its location and status.
            </p>
          ) : (
            <form
              onSubmit={handleQuickUpdate}
              className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm"
            >
              <div className="md:col-span-4 text-xs text-slate-400">
                Editing bus{" "}
                <span className="font-semibold text-slate-100">
                  {selectedBus.busNumber}
                </span>{" "}
                on route{" "}
                <span className="font-semibold text-slate-100">
                  {selectedBus.route?.routeName || "—"}
                </span>
              </div>
              <input
                type="number"
                step="0.000001"
                placeholder="Longitude"
                className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-50 placeholder-slate-500"
                value={editLocation.lng}
                onChange={(e) =>
                  setEditLocation((prev) => ({ ...prev, lng: e.target.value }))
                }
              />
              <input
                type="number"
                step="0.000001"
                placeholder="Latitude"
                className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-50 placeholder-slate-500"
                value={editLocation.lat}
                onChange={(e) =>
                  setEditLocation((prev) => ({ ...prev, lat: e.target.value }))
                }
              />
              <select
                className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-50"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                {["On Time", "Running", "Delayed", "Arrived", "Inactive"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex justify-center rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white hover:bg-indigo-600"
              >
                Save Changes
              </button>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ManageBuses;
