// src/pages/ManageRoutes.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";

// const API_BASE = "http://localhost:5000";
const API_BASE = "https://punjab-projects.onrender.com";

const ManageRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    routeName: "",
    directions: "",
  });

  const [stops, setStops] = useState([
    { name: "", arrivalTime: "", lng: "", lat: "" },
  ]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setMsg("");
      const res = await fetch(`${API_BASE}/api/routes`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch routes");
      setRoutes(Array.isArray(data) ? data : []);
    } catch (err) {
      setMsg(err.message || "Could not load routes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleStopChange = (index, field, value) => {
    setStops((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addStopRow = () => {
    setStops((prev) => [
      ...prev,
      { name: "", arrivalTime: "", lng: "", lat: "" },
    ]);
  };

  const removeStopRow = (index) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      setMsg("");

      // Build stops payload in backend format
      const stopsPayload = stops
        .filter((s) => s.name && s.lng && s.lat)
        .map((s, idx) => ({
          name: s.name,
          arrivalTime: s.arrivalTime || null,
          coordinates: [parseFloat(s.lng), parseFloat(s.lat)],
          sequence: idx,
        }));

      if (stopsPayload.length === 0) {
        setMsg("Please add at least one valid stop");
        return;
      }

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/routes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          routeName: form.routeName,
          directions: form.directions,
          stops: stopsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create route");

      setMsg("Route created successfully");

      setForm({ routeName: "", directions: "" });
      setStops([{ name: "", arrivalTime: "", lng: "", lat: "" }]);
      fetchRoutes();
    } catch (err) {
      setMsg(err.message || "Error creating route");
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm("Are you sure you want to delete this route?")) return;

    try {
      setMsg("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/routes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete route");

      setMsg("Route deleted successfully");
      setRoutes((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setMsg(err.message || "Error deleting route");
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Routes
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage service routes with multiple stops, time and location.
            </p>
          </div>
        </div>

        {msg && (
          <div className="rounded-xl border border-sky-500/50 bg-sky-500/10 text-sky-200 text-sm px-3 py-2">
            {msg}
          </div>
        )}

        {/* Create Route Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">
            Create New Route
          </h2>
          <form onSubmit={handleCreateRoute} className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Route Name"
                className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-50 placeholder-slate-500"
                value={form.routeName}
                onChange={(e) =>
                  setForm({ ...form, routeName: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Directions / Description"
                className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-50 placeholder-slate-500"
                value={form.directions}
                onChange={(e) =>
                  setForm({ ...form, directions: e.target.value })
                }
                required
              />
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Stops (Name, Time, Location)
                </h3>
                <button
                  type="button"
                  onClick={addStopRow}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  + Add stop
                </button>
              </div>

              <div className="space-y-2">
                {stops.map((stop, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center"
                  >
                    <input
                      type="text"
                      placeholder="Stop name"
                      className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-50 placeholder-slate-500"
                      value={stop.name}
                      onChange={(e) =>
                        handleStopChange(index, "name", e.target.value)
                      }
                      required={index === 0}
                    />
                    <input
                      type="time"
                      placeholder="Arrival time"
                      className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-50 placeholder-slate-500"
                      value={stop.arrivalTime}
                      onChange={(e) =>
                        handleStopChange(index, "arrivalTime", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Longitude"
                      className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-50 placeholder-slate-500"
                      value={stop.lng}
                      onChange={(e) =>
                        handleStopChange(index, "lng", e.target.value)
                      }
                      required={index === 0}
                    />
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Latitude"
                      className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-50 placeholder-slate-500"
                      value={stop.lat}
                      onChange={(e) =>
                        handleStopChange(index, "lat", e.target.value)
                      }
                      required={index === 0}
                    />
                    <button
                      type="button"
                      onClick={() => removeStopRow(index)}
                      className="text-xs text-rose-400 hover:text-rose-300 md:text-right"
                      disabled={stops.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="mt-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2"
            >
              Create Route
            </button>
          </form>
        </div>

        {/* Routes table with stops */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 overflow-x-auto">
          <table className="min-w-full text-sm align-top">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="text-left py-2 pr-4">Route Name</th>
                <th className="text-left py-2 pr-4">Directions</th>
                <th className="text-left py-2 pr-4">
                  Stops (Name · Time · Location)
                </th>
                <th className="text-right py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500">
                    Loading routes…
                  </td>
                </tr>
              ) : routes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500">
                    No routes found.
                  </td>
                </tr>
              ) : (
                routes.map((r, idx) => (
                  <tr
                    key={r._id}
                    className={`border-b border-slate-800/60 ${
                      idx % 2 === 0 ? "bg-slate-900/30" : ""
                    }`}
                  >
                    <td className="py-2 pr-4 font-medium">
                      <Link
                        to={`/admin/routes/${r._id}`}
                        className="text-indigo-300 hover:text-indigo-200 underline-offset-2 hover:underline"
                      >
                        {r.routeName || "Unnamed"}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-slate-300 max-w-xs">
                      {r.directions}
                    </td>
                    <td className="py-2 pr-4 text-slate-300">
                      {(!r.stops || r.stops.length === 0) && (
                        <span className="text-slate-500">No stops</span>
                      )}
                      <ul className="space-y-1">
                        {r.stops &&
                          r.stops.map((s, i) => (
                            <li key={i} className="text-xs">
                              <span className="font-medium">{s.name}</span>
                              {s.arrivalTime && (
                                <span className="text-emerald-300 ml-1">
                                  · {s.arrivalTime}
                                </span>
                              )}
                              {s.location &&
                                Array.isArray(s.location.coordinates) && (
                                  <span className="text-slate-500 ml-1">
                                    · [{s.location.coordinates[0].toFixed(4)},{" "}
                                    {s.location.coordinates[1].toFixed(4)}]
                                  </span>
                                )}
                            </li>
                          ))}
                      </ul>
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <button
                        onClick={() => handleDeleteRoute(r._id)}
                        className="text-xs text-rose-400 hover:text-rose-300"
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

export default ManageRoutes;
