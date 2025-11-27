// src/pages/RouteDetails.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";

const API_BASE = "http://localhost:5000";

const RouteDetails = () => {
  const { id } = useParams();
  const [route, setRoute] = useState(null);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setMsg("");

      const [routeRes, busRes] = await Promise.all([
        fetch(`${API_BASE}/api/routes/${id}`),
        fetch(`${API_BASE}/api/bus`),
      ]);

      const [routeData, busData] = await Promise.all([
        routeRes.json(),
        busRes.json(),
      ]);

      if (!routeRes.ok)
        throw new Error(routeData.message || "Failed to fetch route");
      if (!busRes.ok)
        throw new Error(busData.message || "Failed to fetch buses");

      setRoute(routeData);
      const allBuses = Array.isArray(busData) ? busData : [];
      const related = allBuses.filter((b) => {
        const rid = b.route?._id || b.route;
        return rid && rid.toString() === id;
      });
      setBuses(related);
    } catch (err) {
      console.error("RouteDetails error:", err);
      setMsg(err.message || "Failed to load route details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const stops = route?.stops || [];

  const mapCenter = useMemo(() => {
    const coords = stops
      .map((s) => s.location?.coordinates)
      .filter((c) => Array.isArray(c) && c.length === 2);

    if (coords.length === 0) return [31.5, 75.0]; // fallback

    const avgLng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
    const avgLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
    return [avgLat, avgLng];
  }, [stops]);

  const polylinePoints =
    stops
      .map((s) => s.location?.coordinates)
      .filter((c) => Array.isArray(c) && c.length === 2)
      .map((c) => [c[1], c[0]]) || [];

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Route Details
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              View stops, timings and assigned buses for this route.
            </p>
          </div>
          <Link
            to="/admin/routes"
            className="text-xs rounded-lg border border-slate-700 px-3 py-1.5 text-slate-200 hover:bg-slate-800"
          >
            ← Back to routes
          </Link>
        </div>

        {msg && (
          <div className="rounded-xl border border-rose-500/60 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">
            {msg}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-400">Loading route…</p>
        ) : !route ? (
          <p className="text-sm text-slate-400">Route not found.</p>
        ) : (
          <>
            {/* Route info */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    {route.routeName}
                  </h2>
                  <p className="text-sm text-slate-300">{route.directions}</p>
                </div>
                <div className="text-xs text-slate-400">
                  Stops:{" "}
                  <span className="font-semibold text-slate-100">
                    {stops.length}
                  </span>
                  <br />
                  Buses on this route:{" "}
                  <span className="font-semibold text-slate-100">
                    {buses.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Map + stops */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <h3 className="text-sm font-semibold text-slate-100 mb-2">
                  Route Map
                </h3>
                {stops.length === 0 ? (
                  <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/60 text-xs text-slate-500">
                    No stops defined for this route.
                  </div>
                ) : (
                  <MapContainer
                    center={mapCenter}
                    zoom={12}
                    className="h-64 w-full rounded-xl overflow-hidden"
                  >
                    <TileLayer
                      attribution="© OpenStreetMap"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {polylinePoints.length > 1 && (
                      <Polyline positions={polylinePoints} />
                    )}
                    {stops.map((s, idx) => {
                      const c = s.location?.coordinates;
                      if (!c || c.length !== 2) return null;
                      const [lng, lat] = c;
                      return (
                        <Marker key={idx} position={[lat, lng]}>
                          <Popup>
                            <div className="text-xs">
                              <strong>{s.name}</strong>
                              {s.arrivalTime && (
                                <>
                                  <br />
                                  Time: {s.arrivalTime}
                                </>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <h3 className="text-sm font-semibold text-slate-100 mb-2">
                  Stops & Timings
                </h3>
                {stops.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    This route has no stops configured.
                  </p>
                ) : (
                  <ol className="space-y-2 text-xs">
                    {stops
                      .slice()
                      .sort(
                        (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)
                      )
                      .map((s, idx) => (
                        <li
                          key={idx}
                          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                        >
                          <div className="flex justify-between">
                            <span className="font-semibold text-slate-100">
                              {idx + 1}. {s.name}
                            </span>
                            {s.arrivalTime && (
                              <span className="text-emerald-300 text-[11px]">
                                {s.arrivalTime}
                              </span>
                            )}
                          </div>
                          {s.location?.coordinates && (
                            <div className="text-[11px] text-slate-500">
                              [{s.location.coordinates[0].toFixed(4)},{" "}
                              {s.location.coordinates[1].toFixed(4)}]
                            </div>
                          )}
                        </li>
                      ))}
                  </ol>
                )}
              </div>
            </div>

            {/* Buses on this route */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 overflow-x-auto">
              <h3 className="text-sm font-semibold text-slate-100 mb-2">
                Buses on this route
              </h3>
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="text-left py-2 pr-3">Bus</th>
                    <th className="text-left py-2 pr-3">Driver</th>
                    <th className="text-left py-2 pr-3">Status</th>
                    <th className="text-left py-2 pr-3">Location</th>
                    <th className="text-left py-2 pr-3">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-3 text-center text-slate-500"
                      >
                        No buses currently assigned to this route.
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
                          <td className="py-2 pr-3 text-slate-300">
                            {b.driverName || (
                              <span className="text-slate-500">No driver</span>
                            )}
                          </td>
                          <td className="py-2 pr-3">
                            <span className="inline-flex items-center rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-100">
                              {b.status || "Unknown"}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-slate-300">
                            {coords.length === 2 ? (
                              <>
                                [{coords[0].toFixed(4)},{" "}
                                {coords[1].toFixed(4)}]
                              </>
                            ) : (
                              <span className="text-slate-500">N/A</span>
                            )}
                          </td>
                          <td className="py-2 pr-3 text-slate-400">
                            {b.lastUpdated
                              ? new Date(b.lastUpdated).toLocaleString()
                              : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default RouteDetails;
