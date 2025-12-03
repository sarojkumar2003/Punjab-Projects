// src/App.jsx
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import MenuButton from "./components/MenuButton";

export default function App() {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true); // sidebar visible by default

  return (
    <div className="h-screen w-screen flex overflow-hidden">

      {/* Menu Button (visible ONLY when sidebar is closed) */}
      {!sidebarOpen && (
        <MenuButton onClick={() => setSidebarOpen(true)} />
      )}

      {/* Sidebar */}
      <div
        className={`transition-all duration-300 bg-white shadow-xl 
          ${sidebarOpen ? "w-80 sm:w-96" : "w-0"} overflow-hidden`}
      >
        <Sidebar
          onRouteSelect={(route) => setSelectedRoute(route)}
          onClose={() => setSidebarOpen(false)} // CLOSE SIDEBAR
        />
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapView route={selectedRoute} />
      </div>
    </div>
  );
}
