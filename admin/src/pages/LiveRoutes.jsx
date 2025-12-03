// src/pages/LiveRoutes.jsx
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

// Use ONLY local backend
const API_BASE = "http://localhost:5000";

// Helper to move/fit map when route is selected
const RecenterMap = ({ bounds, center }) => {
  const map = useMap();

  useEffect(() => {
    // If we have a route polyline, fit to it
    if (bounds && Array.isArray(bounds) && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [40, 40] });
      return;
    }

    // Fallback: just center the map
    if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, 13);
    }
  }, [bounds, center, map]);

  return null;
};

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

const LiveRoutes = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedRouteId, setSelectedRouteId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const [busRes, routeRes] = await Promise.all([
        fetch(`${API_BASE}/api/bus`),
        fetch(`${API_BASE}/api/routes`),
      ]);

      const [busData, routeData] = await Promise.all([
        busRes.json(),
        routeRes.json(),
      ]);

      if (!busRes.ok)
        throw new Error(busData.message || "Failed to fetch buses");
      if (!routeRes.ok)
        throw new Error(routeData.message || "Failed to fetch routes");

      setBuses(Array.isArray(busData) ? busData : []);
      setRoutes(Array.isArray(routeData) ? routeData : []);
    } catch (err) {
      console.error("LiveRoutes fetch error:", err);
      setErrorMsg(err.message || "Failed to load live route data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, []);

  // Default map center from buses (average of all live buses)
  const defaultCenter = useMemo(() => {
    const coords = buses
      .map((b) => b.currentLocation?.coordinates)
      .filter((c) => Array.isArray(c) && c.length === 2);
    if (!coords.length) return [31.5, 75.0]; // fallback
    const avgLng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const avgLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    return [avgLat, avgLng];
  }, [buses]);

  // Build polyline points from route stops
  const routeLines = useMemo(
    () =>
      routes.map((route) => ({
        id: route._id,
        route,
        points:
          route.stops
            ?.map((s) => {
              const coords = s.location?.coordinates;
              if (!coords || coords.length !== 2) return null;

              // Assuming GeoJSON [lng, lat] in DB
              const [lng, lat] = coords;
              if (
                typeof lat !== "number" ||
                typeof lng !== "number" ||
                Number.isNaN(lat) ||
                Number.isNaN(lng)
              ) {
                return null;
              }
              // Leaflet expects [lat, lng]
              return [lat, lng];
            })
            .filter(Boolean) || [],
      })),
    [routes]
  );

  const selectedRoute = useMemo(
    () => routes.find((r) => r._id === selectedRouteId) || null,
    [routes, selectedRouteId]
  );

  // Center for selected route (average of its stops or its buses)
  const selectedRouteCenter = useMemo(() => {
    // 1) from route stops
    if (selectedRoute?.stops?.length) {
      const coords = selectedRoute.stops
        .map((s) => s.location?.coordinates)
        .filter((c) => Array.isArray(c) && c.length === 2);
      if (!coords.length) return null;
      const avgLng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
      const avgLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
      return [avgLat, avgLng];
    }

    // 2) fallback: center on buses of that route
    if (selectedRouteId) {
      const onRoute = buses.filter((b) => {
        if (b.route && typeof b.route === "object" && b.route._id) {
          return b.route._id === selectedRouteId;
        }
        if (typeof b.route === "string") return b.route === selectedRouteId;
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
  }, [selectedRoute, selectedRouteId, buses]);

  const mapCenter = selectedRouteCenter || defaultCenter;

  // Selected route polyline (for fitBounds)
  const selectedRouteLine = useMemo(
    () => routeLines.find((r) => r.id === selectedRouteId) || null,
    [routeLines, selectedRouteId]
  );

  // Route → buses map (all routes, even if 0 buses)
  const liveRouteBusData = useMemo(
    () =>
      routes.map((route) => {
        const busesOnRoute = buses.filter((b) => {
          if (b.route && typeof b.route === "object" && b.route._id) {
            return b.route._id === route._id;
          }
          if (typeof b.route === "string") return b.route === route._id;
          return false;
        });
        return { route, buses: busesOnRoute };
      }),
    [routes, buses]
  );

  const hasAnyData = routes.length > 0 || buses.length > 0;

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Live Routes</h1>
            <p className="text-sm text-slate-400">
              View each route with live bus positions and stop layout.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500/90 px-4 py-2 text-xs font-semibold text-white shadow shadow-indigo-500/30 hover:bg-indigo-600"
          >
            ⟳ Refresh
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-rose-500/60 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {errorMsg}
          </div>
        )}

        {/* Map + side panel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Map */}
          <div className="xl:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">
                Route Map
              </h2>
              <span className="text-[11px] text-slate-500">
                Click a route card to highlight
              </span>
            </div>

            {!hasAnyData ? (
              <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/60 text-xs text-slate-500">
                No routes or buses yet. Add data from the Routes and Buses
                sections.
              </div>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={12}
                className="h-80 w-full rounded-xl overflow-hidden"
              >
                <TileLayer
                  attribution="© OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Recenter/fit on selected route or center fallback */}
                <RecenterMap
                  bounds={selectedRouteLine?.points}
                  center={mapCenter}
                />

                {/* Route lines + start/end markers */}
                {routeLines.map((r) => {
                  if (!r.points.length) return null;

                  const isSelected = r.id === selectedRouteId;
                  const start = r.points[0];
                  const end = r.points[r.points.length - 1];

                  return (
                    <React.Fragment key={r.id}>
                      {r.points.length > 1 && (
                        <Polyline
                          positions={r.points}
                          pathOptions={{
                            color: isSelected ? "#22c55e" : "#64748b",
                            weight: isSelected ? 5 : 3,
                            opacity: isSelected ? 0.9 : 0.45,
                            dashArray: isSelected ? null : "4 8",
                          }}
                        />
                      )}

                      {/* Start stop marker */}
                      <Marker position={start}>
                        <Popup>
                          <div className="text-xs">
                            <strong>{r.route.routeName}</strong>
                            <br />
                            Start stop
                          </div>
                        </Popup>
                      </Marker>

                      {/* End stop marker (if different from start) */}
                      {r.points.length > 1 && (
                        <Marker position={end}>
                          <Popup>
                            <div className="text-xs">
                              <strong>{r.route.routeName}</strong>
                              <br />
                              Last stop
                            </div>
                          </Popup>
                        </Marker>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Bus markers */}
                {buses.map((b) => {
                  const coords = b.currentLocation?.coordinates;
                  if (!Array.isArray(coords) || coords.length !== 2) return null;
                  const [lng, lat] = coords;
                  if (
                    typeof lat !== "number" ||
                    typeof lng !== "number" ||
                    Number.isNaN(lat) ||
                    Number.isNaN(lng)
                  )
                    return null;

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
                          Last update: {timeAgo(b.lastUpdated)}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            )}
          </div>

          {/* Route list / live status */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-100">
                Routes & Live Buses
              </h2>
              <span className="text-[11px] text-slate-500">
                {routes.length} routes
              </span>
            </div>

            {routes.length === 0 ? (
              <p className="text-xs text-slate-500">
                No routes created yet. Go to <b>Admin &gt; Routes</b> to add a
                new route with stops.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-auto pr-1">
                {liveRouteBusData.map(({ route, buses: busesOnRoute }) => {
                  const isSelected = selectedRouteId === route._id;
                  return (
                    <button
                      key={route._id}
                      type="button"
                      onClick={() =>
                        setSelectedRouteId(isSelected ? null : route._id)
                      }
                      className={`w-full text-left rounded-xl border px-3 py-2 text-xs transition ${
                        isSelected
                          ? "border-emerald-400 bg-emerald-500/10"
                          : "border-slate-700 bg-slate-900 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-100">
                            {route.routeName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {route.stops?.length || 0} stops ·{" "}
                            {busesOnRoute.length} bus(es) live
                          </p>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {isSelected ? "Focused" : "View"}
                        </span>
                      </div>

                      {busesOnRoute.length > 0 && (
                        <ul className="mt-1 space-y-1">
                          {busesOnRoute.map((b) => (
                            <li
                              key={b._id}
                              className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-slate-950/70 px-2 py-1"
                            >
                              <div>
                                <p className="text-slate-100 text-[11px]">
                                  Bus {b.busNumber}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Last update: {timeAgo(b.lastUpdated)}
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${
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
                          ))}
                        </ul>
                      )}

                      {busesOnRoute.length === 0 && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          No bus currently on this route.
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LiveRoutes;
