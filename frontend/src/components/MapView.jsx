// src/components/MapView.jsx
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import { fetchNearbyBuses } from "../api";

const DEFAULT_CENTER = [28.55, 77.35]; // [lat, lng]

/** Helper: whenever center changes, move the map there */
function RecenterOnChange({ center }) {
  const map = useMap();

  useEffect(() => {
    if (Array.isArray(center) && center.length === 2) {
      map.setView(center);
    }
  }, [center, map]);

  return null;
}

export default function MapView({ route }) {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [nearbyBuses, setNearbyBuses] = useState([]);
  // Store previous position per bus so we can show “movement”
  const [previousBusPositions, setPreviousBusPositions] = useState({});

  // Convert route stops into Leaflet positions [lat, lng]
  const routePositions = useMemo(() => {
    if (!route || !Array.isArray(route.stops)) return [];

    return route.stops
      .map((stop) => {
        const coords = stop.location?.coordinates;
        if (!Array.isArray(coords) || coords.length !== 2) return null;

        const [lng, lat] = coords;
        const latNum = Number(lat);
        const lngNum = Number(lng);

        if (
          Number.isNaN(latNum) ||
          Number.isNaN(lngNum) ||
          latNum < -90 ||
          latNum > 90 ||
          lngNum < -180 ||
          lngNum > 180
        ) {
          return null;
        }

        return [latNum, lngNum];
      })
      .filter(Boolean);
  }, [route]);

  // When route changes, set center to first stop
  useEffect(() => {
    if (routePositions.length > 0) {
      setCenter(routePositions[0]);
    } else {
      setCenter(DEFAULT_CENTER);
    }
  }, [routePositions]);

  // Poll nearby buses every 10 seconds and track previous positions
  useEffect(() => {
    let isMounted = true;

    const loadBuses = async () => {
      try {
        const [lat, lng] = center;
        const data = await fetchNearbyBuses(lat, lng, 3000);
        if (!isMounted) return;

        const safeData = Array.isArray(data) ? data : [];

        // Build map of previous positions
        setPreviousBusPositions((prev) => {
          const nextPrev = { ...prev };

          safeData.forEach((bus) => {
            const coords = bus.currentLocation?.coordinates;
            if (!Array.isArray(coords) || coords.length !== 2) return;

            const [lngVal, latVal] = coords;
            const latNum = Number(latVal);
            const lngNum = Number(lngVal);

            if (
              Number.isNaN(latNum) ||
              Number.isNaN(lngNum) ||
              latNum < -90 ||
              latNum > 90 ||
              lngNum < -180 ||
              lngNum > 180
            ) {
              return;
            }

            const id = bus._id;
            const current = [latNum, lngNum];

            // If we don't have a previous entry, set it to current
            if (!nextPrev[id]) {
              nextPrev[id] = current;
            } else {
              // If the position actually changed, update previous
              const [prevLat, prevLng] = nextPrev[id];
              if (prevLat !== latNum || prevLng !== lngNum) {
                nextPrev[id] = [latNum, lngNum];
              }
            }
          });

          return nextPrev;
        });

        setNearbyBuses(safeData);
      } catch (error) {
        console.error("Error fetching nearby buses:", error);
      }
    };

    loadBuses();
    const intervalId = setInterval(loadBuses, 10000); // 10 seconds

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [center]);

  const firstStop = routePositions[0];
  const lastStop = routePositions[routePositions.length - 1];

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        <RecenterOnChange center={center} />

        {/* Route polyline */}
        {routePositions.length > 1 && (
          <Polyline positions={routePositions} />
        )}

        {/* Route start / end pointers */}
        {firstStop && (
          <CircleMarker
            center={firstStop}
            radius={6}
            pathOptions={{
              color: "#16a34a",
              fillColor: "#16a34a",
              fillOpacity: 0.9,
            }}
          >
            <Popup>Start of route</Popup>
          </CircleMarker>
        )}

        {lastStop && (
          <CircleMarker
            center={lastStop}
            radius={6}
            pathOptions={{
              color: "#dc2626",
              fillColor: "#dc2626",
              fillOpacity: 0.9,
            }}
          >
            <Popup>End of route</Popup>
          </CircleMarker>
        )}

        {/* Buses: dot + small trail from previous to current */}
        {nearbyBuses.map((bus) => {
          const coords = bus.currentLocation?.coordinates;
          if (!Array.isArray(coords) || coords.length !== 2) return null;

          const [lng, lat] = coords;
          const latNum = Number(lat);
          const lngNum = Number(lng);

          if (
            Number.isNaN(latNum) ||
            Number.isNaN(lngNum) ||
            latNum < -90 ||
            latNum > 90 ||
            lngNum < -180 ||
            lngNum > 180
          ) {
            return null;
          }

          const currentPos = [latNum, lngNum];
          const prevPos = previousBusPositions[bus._id];

          return (
            <div key={bus._id}>
              {/* short line showing movement direction (prev -> current) */}
              {prevPos && (
                <Polyline
                  positions={[prevPos, currentPos]}
                  pathOptions={{
                    color: "#93c5fd",
                    weight: 2,
                  }}
                />
              )}

              {/* current bus position */}
              <CircleMarker
                center={currentPos}
                radius={5}
                pathOptions={{
                  color: "#2563eb",
                  fillColor: "#2563eb",
                  fillOpacity: 0.9,
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <div>Bus: {bus.busNumber}</div>
                    {bus.status && <div>Status: {bus.status}</div>}
                    {bus.lastUpdated && (
                      <div>
                        Updated:{" "}
                        {new Date(bus.lastUpdated).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
