// src/components/Sidebar.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchRoutes } from "../api";

export default function Sidebar({ onRouteSelect }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load all routes once from backend
  useEffect(() => {
    let isMounted = true;

    const loadRoutes = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchRoutes();
        if (!isMounted) return;
        setRoutes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch routes:", err);
        if (isMounted) setError("Failed to load routes");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRoutes();
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Filter routes based on From / To text.
   * - matches stop names (case-insensitive, includes)
   * - if both From & To: allow both directions
   *   (e.g. Dwarka → Dhaula Kuan OR Dhaula Kuan → Dwarka)
   * - store _fromIndex, _toIndex and _reverse flags inside each route
   *   so details panel can show sub-route correctly.
   */
  const filteredRoutes = useMemo(() => {
    if (!Array.isArray(routes) || routes.length === 0) return [];

    const fromTerm = from.trim().toLowerCase();
    const toTerm = to.trim().toLowerCase();

    return routes
      .map((route) => {
        const stops = Array.isArray(route.stops) ? route.stops : [];
        const names = stops.map((s) => (s.name || "").toLowerCase());

        const fromIndex = fromTerm
          ? names.findIndex((n) => n.includes(fromTerm))
          : -1;
        const toIndex = toTerm
          ? names.findIndex((n) => n.includes(toTerm))
          : -1;

        let matches = false;
        let reverse = false;

        if (fromTerm && toTerm) {
          if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
            matches = true;
            reverse = fromIndex > toIndex; // if From appears after To, it's reverse
          }
        } else if (fromTerm) {
          matches = fromIndex !== -1;
        } else if (toTerm) {
          matches = toIndex !== -1;
        } else {
          matches = true; // no search → show all
        }

        return {
          ...route,
          _fromIndex: fromIndex,
          _toIndex: toIndex,
          _reverse: reverse,
          _matches: matches,
        };
      })
      .filter((r) => r._matches);
  }, [routes, from, to]);

  const handleSelectRoute = (route, id) => {
    setSelectedRouteId(id);
    setSelectedRoute(route);
    if (typeof onRouteSelect === "function") {
      onRouteSelect(route);
    }
  };

  /**
   * Build list of stops for the detail panel.
   * - No search: full route.
   * - From & To: sub-segment between them (reversed if needed).
   * - Only From: from that stop to end.
   * - Only To: from start to that stop.
   */
  const detailStops = useMemo(() => {
    if (!selectedRoute) return [];

    const allStops = Array.isArray(selectedRoute.stops)
      ? selectedRoute.stops
      : [];

    const fromTerm = from.trim().toLowerCase();
    const toTerm = to.trim().toLowerCase();
    const hasFrom = !!fromTerm;
    const hasTo = !!toTerm;

    if (!hasFrom && !hasTo) return allStops;

    const fromIndex =
      typeof selectedRoute._fromIndex === "number" &&
      selectedRoute._fromIndex >= 0
        ? selectedRoute._fromIndex
        : -1;
    const toIndex =
      typeof selectedRoute._toIndex === "number" &&
      selectedRoute._toIndex >= 0
        ? selectedRoute._toIndex
        : -1;

    if (hasFrom && hasTo && fromIndex !== -1 && toIndex !== -1) {
      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);
      const segment = allStops.slice(start, end + 1);
      return selectedRoute._reverse ? [...segment].reverse() : segment;
    }

    if (hasFrom && fromIndex !== -1) {
      return allStops.slice(fromIndex);
    }

    if (hasTo && toIndex !== -1) {
      return allStops.slice(0, toIndex + 1);
    }

    return allStops;
  }, [selectedRoute, from, to]);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 pt-3 pb-2">
        <span className="text-sm sm:text-base font-semibold">Directions</span>
        
      </div>

      {/* Bus label */}
      <div className="border-b border-slate-200 px-3 py-2">
        <div className="w-full rounded-full py-1 text-center bg-blue-50 border border-blue-500 text-blue-700 text-[11px] sm:text-[12px] font-semibold">
          Bus
        </div>
      </div>

      {/* Search inputs */}
      <div className="border-b border-slate-200 px-3 sm:px-4 py-3 flex flex-col gap-2">
        <input
          className="w-full rounded-full border border-slate-300 px-3 py-2 text-xs sm:text-[13px] focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="From (e.g. dwarka sector 21)"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />

        <input
          className="w-full rounded-full border border-slate-300 px-3 py-2 text-xs sm:text-[13px] focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="To (e.g. dhaula kuan)"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      {/* Status */}
      <div className="border-b border-slate-200 px-4 py-2 text-[11px] sm:text-[12px] text-slate-600">
        {loading && <p>Loading bus routes…</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && routes.length > 0 && (
          <p>
            Loaded {routes.length} bus routes. Showing{" "}
            {filteredRoutes.length} result
            {filteredRoutes.length === 1 ? "" : "s"} for your search.
          </p>
        )}

        {!loading && !error && routes.length === 0 && (
          <p>No bus routes found in database.</p>
        )}
      </div>

      {/* Routes list */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 pt-2 space-y-2">
        {filteredRoutes.map((route, index) => {
          const id = route._id || index;
          const stops = Array.isArray(route.stops) ? route.stops : [];
          const firstStop = stops[0]?.name || "Start";
          const lastStop = stops[stops.length - 1]?.name || "End";

          return (
            <button
              key={id}
              onClick={() => handleSelectRoute(route, id)}
              className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
                selectedRouteId === id
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 bg-white hover:border-blue-300"
              }`}
            >
              <p className="text-sm sm:text-[15px] font-semibold">
                {route.routeName}
              </p>
              <p className="text-[11px] sm:text-[12px] text-slate-500">
                {firstStop} → {lastStop}
              </p>
            </button>
          );
        })}

        {!loading &&
          !error &&
          filteredRoutes.length === 0 &&
          routes.length > 0 && (
            <p className="mt-2 text-[11px] text-slate-500">
              No routes match these stops. Try checking spelling or using a
              shorter name.
            </p>
          )}
      </div>

      {/* Route details: full or sub-route, with close button */}
      {selectedRoute && (
        <div className="border-t border-slate-300 bg-white px-3 sm:px-4 py-3 text-xs sm:text-[12px] relative">
          {/* Close details button */}
          <button
            onClick={() => {
              setSelectedRoute(null);
              setSelectedRouteId(null);
            }}
            className="absolute top-3 right-3 text-slate-500 hover:text-slate-700 text-sm"
            title="Close details"
          >
            ✕
          </button>

          <p className="text-sm sm:text-[15px] font-semibold mb-1 pr-6">
            {selectedRoute.routeName}
          </p>

          <p className="text-slate-600 mb-1">
            {from.trim() || to.trim()
              ? `Showing sub-route from "${from || "start"}" to "${
                  to || "end"
                }" (direction based on your search)`
              : `Total stops: ${selectedRoute.stops?.length || 0}`}
          </p>

          {!from.trim() && !to.trim() && (
            <p className="text-slate-500 mb-1">
              Use From / To search above to view a specific segment of this
              route.
            </p>
          )}

          <div className="max-h-40 sm:max-h-56 overflow-y-auto border rounded-lg p-2 bg-slate-50">
            {detailStops.map((stop, index) => (
              <div
                key={index}
                className="py-1 border-b last:border-b-0 text-[11px] sm:text-[12px]"
              >
                <p className="font-medium">{stop.name}</p>
                {stop.arrivalTime && (
                  <p className="text-slate-500">Time: {stop.arrivalTime}</p>
                )}
              </div>
            ))}

            {detailStops.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No matching stops for this segment.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-[11px] sm:text-[12px] text-slate-600">
        continue your trip & track your bus live with punjab transport app!
      </div>
    </div>
  );
}
