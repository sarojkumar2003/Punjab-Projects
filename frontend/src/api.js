// src/api.js
const API_BASE_URL = "http://localhost:5000";

export async function fetchRoutes() {
  const response = await fetch(`${API_BASE_URL}/api/routes`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch routes: ${response.status}`);
  }

  return response.json();
}

export async function fetchNearbyBuses(lat, lng, maxDistanceMeters = 3000) {
  const url = new URL(`${API_BASE_URL}/api/bus/nearby`);
  url.searchParams.append("lat", lat);
  url.searchParams.append("lng", lng);
  url.searchParams.append("maxDistanceMeters", maxDistanceMeters);  
    const response = await fetch(url.toString(), {  
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
    if (!response.ok) {
    throw new Error(`Failed to fetch nearby buses: ${response.status}`);
    }
    return response.json();
}

