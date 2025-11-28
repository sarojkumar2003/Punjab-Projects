// src/pages/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";

// const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const API_BASE = "https://punjab-projects.onrender.com";


// Utility: convert timestamp to "time ago"
const timeAgo = (dateStr) => {
  if (!dateStr) return "Unknown";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  if (diffMs < 60000) return "Just now";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

// Small helper component to recenter map when center changes
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, 13); // zoom 13 on selected route
    }
  }, [center, map]);
  return null;
};

const AdminDashboard = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [stats, setStats] = useState({
    totalBuses: 0,
    activeBuses: 0,
    delayedBuses: 0,
    totalRoutes: 0,
    driverCount: 0,
    userCount: 0,
  });

  // NEW: which route is selected (via Live Route cards)
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  // ------------------------------------------------------------------------
  // FETCH DASHBOARD DATA
  // ------------------------------------------------------------------------
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const token = localStorage.getItem("token");

      // buses + routes are required
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

      const allBuses = Array.isArray(busData) ? busData : [];
      const allRoutes = Array.isArray(routeData) ? routeData : [];

      // Drivers are OPTIONAL (dashboard should not break if endpoint missing)
      let allDrivers = [];
      try {
        const driverRes = await fetch(`${API_BASE}/api/drivers`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (driverRes.ok) {
          const driverData = await driverRes.json();
          if (Array.isArray(driverData)) {
            allDrivers = driverData;
          }
        }
      } catch (err) {
        console.warn("Driver fetch failed (optional) :", err);
      }

      // Count buses
      const totalBuses = allBuses.length;
      const delayedBuses = allBuses.filter(
        (b) => (b.status || "").toLowerCase() === "delayed"
      ).length;
      const activeBuses = allBuses.filter((b) => {
        const s = (b.status || "").toLowerCase();
        return ["running", "on time", "active"].includes(s);
      }).length;

      // Count routes
      const totalRoutes = allRoutes.length;

      // Count drivers
      const driverCount = allDrivers.length;

      // Users are OPTIONAL too
      let userCount = 0;
      try {
        const userRes = await fetch(`${API_BASE}/api/admin/users`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          if (Array.isArray(userData)) {
            userCount = userData.length;
          }
        }
      } catch (err) {
        console.warn("User fetch failed (optional):", err);
      }

      setStats({
        totalBuses,
        activeBuses,
        delayedBuses,
        totalRoutes,
        driverCount,
        userCount,
      });

      setBuses(allBuses);
      setRoutes(allRoutes);
      setDrivers(allDrivers);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setErrorMsg(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // auto-refresh
    return () => clearInterval(interval);
  }, []);

  // ------------------------------------------------------------------------
  // ALERT SYSTEM
  // ------------------------------------------------------------------------
  const alerts = useMemo(() => {
    const items = [];
    const now = Date.now();
    const OFFLINE_LIMIT = 10; // minutes

    buses.forEach((bus) => {
      const lastUpdate = bus.lastUpdated ? new Date(bus.lastUpdated).getTime() : 0;
      const minsDiff = (now - lastUpdate) / 60000;

      if (minsDiff > OFFLINE_LIMIT) {
        items.push({
          type: "offline",
          severity: "high",
          message: `Bus ${bus.busNumber} is offline for ${Math.floor(
            minsDiff
          )} min`,
        });
      }

      if ((bus.status || "").toLowerCase() === "delayed") {
        items.push({
          type: "delayed",
          severity: "medium",
          message: `Bus ${bus.busNumber} is delayed`,
        });
      }

      if (bus.emergency) {
        items.push({
          type: "emergency",
          severity: "high",
          message: `🚨 Emergency on Bus ${bus.busNumber} (${
            bus.issueNote || "No details"
          })`,
        });
      }
    });

    return items.slice(0, 6);
  }, [buses]);

  // ------------------------------------------------------------------------
  // MAP CENTER + ROUTE POLYLINES
  // ------------------------------------------------------------------------
  const defaultMapCenter = useMemo(() => {
    const coords = buses
      .map((b) => b.currentLocation?.coordinates)
      .filter((c) => Array.isArray(c));

    if (!coords.length) return [31.5, 75.0]; // Punjab-ish default

    const avgLng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const avgLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;

    return [avgLat, avgLng];
  }, [buses]);

  const routeLines = useMemo(
    () =>
      routes.map((route) => ({
        id: route._id,
        points:
          route.stops
            ?.map((s) => {
              const coords = s.location?.coordinates;
              if (!coords || coords.length !== 2) return null;
              const [lng, lat] = coords;
              return [lat, lng];
            })
            .filter(Boolean) || [],
      })),
    [routes]
  );

  // Selected route details (for map focus)
  const selectedRoute = useMemo(
    () => routes.find((r) => r._id === selectedRouteId) || null,
    [routes, selectedRouteId]
  );

  const selectedRouteCenter = useMemo(() => {
    if (selectedRoute?.stops?.length) {
      // average of stops
      const coords = selectedRoute.stops
        .map((s) => s.location?.coordinates)
        .filter((c) => Array.isArray(c) && c.length === 2);
      if (!coords.length) return null;
      const avgLng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
      const avgLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
      return [avgLat, avgLng];
    }

    // fallback: if route has no stops but buses are on it
    if (selectedRouteId) {
      const onRoute = buses.filter((b) => {
        if (b.route && typeof b.route === "object" && b.route._id) {
          return b.route._id === selectedRouteId;
        }
        if (typeof b.route === "string") {
          return b.route === selectedRouteId;
        }
        return false;
      });
      const coords = onRoute
        .map((b) => b.currentLocation?.coordinates)
        .filter((c) => Array.isArray(c) && c.length === 2);
      if (!coords.length) return null;
      const avgLng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
      const avgLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
      return [avgLat, avgLng];
    }

    return null;
  }, [selectedRoute, buses, selectedRouteId]);

  const mapCenter = selectedRouteCenter || defaultMapCenter;

  // ------------------------------------------------------------------------
  // DRIVER SUMMARY
  // ------------------------------------------------------------------------
  const driverSummary = useMemo(() => {
    if (drivers.length > 0) {
      return drivers
        .filter((d) => d.isActive !== false)
        .slice(0, 5)
        .map((d) => ({
          name: d.name,
          phone: d.phone,
          bus: d.assignedBus?.busNumber || "Unassigned",
          status: d.assignedBus ? "On Duty" : "Idle",
        }));
    }

    // fallback: infer drivers from buses if driver collection not used
    return buses
      .filter((b) => b.driverName)
      .slice(0, 5)
      .map((b) => ({
        name: b.driverName,
        phone: b.driverPhone,
        bus: b.busNumber,
        status: b.status,
      }));
  }, [drivers, buses]);

  // ------------------------------------------------------------------------
  // TOP ROUTES (Busiest + Most Delayed)
  // ------------------------------------------------------------------------
  const routeStats = useMemo(() => {
    const map = new Map();

    buses.forEach((b) => {
      if (!b.route?._id) return;

      const id = b.route._id.toString();
      if (!map.has(id)) {
        map.set(id, {
          name: b.route.routeName || "Unnamed Route",
          busCount: 0,
          delayedCount: 0,
        });
      }

      const r = map.get(id);
      r.busCount++;
      if ((b.status || "").toLowerCase() === "delayed") {
        r.delayedCount++;
      }
    });

    const arr = [...map.values()];

    return {
      busiest: arr.sort((a, b) => b.busCount - a.busCount).slice(0, 3),
      mostDelayed: arr.sort((a, b) => b.delayedCount - a.delayedCount).slice(0, 3),
    };
  }, [buses]);

  // ------------------------------------------------------------------------
  // RECENT ACTIVITY
  // ------------------------------------------------------------------------
  const recentActivity = useMemo(() => {
    const events = [];

    buses.forEach((b) =>
      events.push({
        text: `Bus ${b.busNumber} updated (${b.status || "Unknown"})`,
        time: b.lastUpdated,
      })
    );

    routes.forEach((r) =>
      events.push({
        text: `Route updated: ${r.routeName}`,
        time: r.updatedAt,
      })
    );

    return events
      .filter((e) => e.time)
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 8);
  }, [buses, routes]);

  const hasAnyData = buses.length > 0 || routes.length > 0;

  // ------------------------------------------------------------------------
  // LIVE BUS UPDATE PER ROUTE – NOW FROM ALL ROUTES
  // ------------------------------------------------------------------------
  const liveRouteBusData = useMemo(
    () =>
      routes
        .map((route) => {
          const busesOnRoute = buses.filter((b) => {
            if (b.route && typeof b.route === "object" && b.route._id) {
              return b.route._id === route._id;
            }
            if (typeof b.route === "string") {
              return b.route === route._id;
            }
            return false;
          });
          return {
            route,
            buses: busesOnRoute,
          };
        })
        .sort((a, b) => b.buses.length - a.buses.length),
    [routes, buses]
  );

  // ------------------------------------------------------------------------
  // RENDER UI
  // ------------------------------------------------------------------------
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-700 via-sky-600 to-emerald-500 px-4 py-5 md:px-6 md:py-6">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-indigo-100/80">
                Punjab Commute · Control Center
              </p>
              <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-white">
                Real-Time Transport Dashboard
              </h1>
              <p className="mt-2 text-sm text-indigo-100/90 max-w-xl">
                Monitor buses, routes, drivers and alerts in one place. Data
                auto-refreshes every 10 seconds.
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-black/20 backdrop-blur hover:bg-white/20 transition"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Refresh now
              </button>
              <p className="text-[11px] text-indigo-100/80">
                Status:{" "}
                <span className="font-medium">
                  {loading ? "Syncing data..." : hasAnyData ? "Live" : "Waiting for data"}
                </span>
              </p>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            { label: "Total Buses", value: stats.totalBuses, icon: "🚌" },
            { label: "Active Buses", value: stats.activeBuses, icon: "📍" },
            { label: "Delayed Buses", value: stats.delayedBuses, icon: "⏰" },
            { label: "Total Routes", value: stats.totalRoutes, icon: "🛣️" },
            { label: "Drivers", value: stats.driverCount, icon: "👨‍✈️" },
            { label: "Users", value: stats.userCount, icon: "👥" },
          ].map((c, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 shadow-sm hover:border-indigo-500/60 hover:shadow-indigo-500/20 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    {c.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-50">
                    {loading ? "…" : c.value}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/80 text-lg">
                  {c.icon}
                </div>
              </div>
              <div className="pointer-events-none absolute -right-6 -bottom-6 h-12 w-12 rounded-full bg-indigo-500/10 group-hover:bg-indigo-500/25 transition" />
            </div>
          ))}
        </div>

        {/* Alerts + Map */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Alerts */}
          <div className="xl:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">Alerts</h2>
              <span className="text-[11px] text-slate-500">
                {alerts.length || 0} active
              </span>
            </div>
            {alerts.length === 0 ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-100">
                ✅ System healthy. No active alerts at the moment.
              </div>
            ) : (
              <ul className="space-y-2 text-xs">
                {alerts.map((a, i) => (
                  <li
                    key={i}
                    className={`rounded-xl border px-3 py-2 ${
                      a.severity === "high"
                        ? "border-rose-500/60 bg-rose-500/10 text-rose-100"
                        : "border-amber-500/60 bg-amber-500/10 text-amber-100"
                    }`}
                  >
                    {a.message}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Map */}
          <div className="xl:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">
                Live Bus Map
              </h2>
              <span className="text-[11px] text-slate-500">
                Data from /api/bus & /api/routes
              </span>
            </div>
            {buses.length === 0 && routes.length === 0 ? (
              <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/60 text-xs text-slate-500">
                No live data yet. Add buses and routes to see them on the map.
              </div>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={12}
                className="h-72 w-full rounded-xl overflow-hidden"
              >
                <TileLayer
                  attribution="© OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Recenter when route is selected */}
                {selectedRouteCenter && (
                  <RecenterMap center={selectedRouteCenter} />
                )}

                {/* Route Polylines */}
                {routeLines.map((r) =>
                  r.points.length > 1 ? (
                    <Polyline
                      key={r.id}
                      positions={r.points}
                      pathOptions={
                        r.id === selectedRouteId
                          ? { color: "#22c55e", weight: 5 } // highlight selected
                          : { color: "#64748b", weight: 3 }
                      }
                    />
                  ) : null
                )}

                {/* Buses */}
                {buses.map((b) => {
                  const coords = b.currentLocation?.coordinates;
                  if (!Array.isArray(coords) || coords.length !== 2) return null;
                  const [lng, lat] = coords;
                  if (
                    typeof lat !== "number" ||
                    typeof lng !== "number" ||
                    Number.isNaN(lat) ||
                    Number.isNaN(lng)
                  ) {
                    return null;
                  }

                  return (
                    <Marker key={b._id} position={[lat, lng]}>
                      <Popup>
                        <div className="text-xs">
                          <strong>Bus {b.busNumber}</strong>
                          <br />
                          Route: {b.route?.routeName || "N/A"}
                          <br />
                          Status: {b.status || "Unknown"}
                          <br />
                          {typeof b.speed === "number" && (
                            <>
                              Speed: {b.speed} km/h
                              <br />
                            </>
                          )}
                          Last update: {timeAgo(b.lastUpdated)}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            )}
          </div>
        </div>

        {/* Driver Summary + Route Performance + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Driver Summary */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Driver Summary
            </h2>
            {driverSummary.length === 0 ? (
              <p className="text-xs text-slate-500">
                No driver information available yet. Add drivers and assign them
                to buses from the management panel.
              </p>
            ) : (
              <ul className="space-y-2 text-xs">
                {driverSummary.map((d, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2"
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-100">
                        {d.name}
                      </span>
                      <span className="text-slate-400">
                        {d.bus === "Unassigned" ? "No bus" : `Bus ${d.bus}`}
                      </span>
                    </div>
                    {d.phone && (
                      <div className="text-slate-400">{d.phone}</div>
                    )}
                    <div className="text-[11px] text-slate-500">
                      Status: {d.status || "Unknown"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Route Performance */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Route Performance
            </h2>
            {routeStats.busiest.length === 0 ? (
              <p className="text-xs text-slate-500">
                No active routes with buses yet.
              </p>
            ) : (
              <>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 mb-1">
                    Busiest Routes
                  </p>
                  <div className="space-y-1 text-xs">
                    {routeStats.busiest.map((r, i) => (
                      <div
                        key={i}
                        className="flex justify-between rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5"
                      >
                        <span>{r.name}</span>
                        <span className="text-slate-400">
                          {r.busCount} bus(es)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-[11px] font-semibold text-slate-400 mb-1">
                    Most Delayed Routes
                  </p>
                  <div className="space-y-1 text-xs">
                    {routeStats.mostDelayed.map((r, i) => (
                      <div
                        key={i}
                        className="flex justify-between rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5"
                      >
                        <span>{r.name}</span>
                        <span className="text-amber-300">
                          {r.delayedCount} delayed
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Recent Activity
            </h2>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-500">
                No recent updates. Activities will appear here as buses, routes
                and drivers are updated.
              </p>
            ) : (
              <ul className="space-y-2 text-xs">
                {recentActivity.map((a, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2"
                  >
                    <div>{a.text}</div>
                    <div className="text-[11px] text-slate-500">
                      {timeAgo(a.time)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* LIVE BUS UPDATES PER ROUTE (clickable) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-100">
              Live Route Bus Updates
            </h2>
            <span className="text-[11px] text-slate-500">
              Click a route card to focus on map
            </span>
          </div>

          {liveRouteBusData.length === 0 ? (
            <p className="text-xs text-slate-500">
              No routes available yet. When you create routes and assign buses,
              they’ll appear here with live status.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {liveRouteBusData.map(({ route, buses: busesOnRoute }) => {
                const isSelected = selectedRouteId === route._id;
                return (
                  <button
                    key={route._id}
                    type="button"
                    onClick={() =>
                      setSelectedRouteId(
                        isSelected ? null : route._id // click again to unselect
                      )
                    }
                    className={`text-left rounded-xl border px-3 py-3 text-xs transition ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-500/10"
                        : "border-slate-700 bg-slate-900 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="font-semibold text-slate-100">
                          {route.routeName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {route.stops?.length || 0} stops ·{" "}
                          {busesOnRoute.length} bus(es) live
                        </p>
                      </div>
                    </div>

                    <ul className="mt-2 space-y-1">
                      {busesOnRoute.length === 0 ? (
                        <li className="text-[11px] text-slate-500">
                          No bus currently on this route.
                        </li>
                      ) : (
                        busesOnRoute.map((b) => (
                          <li
                            key={b._id}
                            className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-slate-950/70 px-2 py-1"
                          >
                            <div>
                              <p className="text-slate-100 text-xs">
                                Bus {b.busNumber}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Last update: {timeAgo(b.lastUpdated)}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                                (b.status || "").toLowerCase() === "delayed"
                                  ? "bg-amber-500/15 text-amber-200 border border-amber-500/50"
                                  : (b.status || "").toLowerCase() ===
                                    "inactive"
                                  ? "bg-slate-700/40 text-slate-200 border border-slate-600/60"
                                  : "bg-emerald-500/15 text-emerald-200 border border-emerald-500/50"
                              }`}
                            >
                              {b.status || "Unknown"}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty-state hint */}
        {!loading && !hasAnyData && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 px-4 py-3 text-xs text-slate-400">
            ℹ️ Currently there are no buses or routes in the system. Go to{" "}
            <span className="font-semibold text-slate-200">
              Admin &gt; Buses
            </span>{" "}
            and{" "}
            <span className="font-semibold text-slate-200">
              Admin &gt; Routes
            </span>{" "}
            to start adding live data.
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
