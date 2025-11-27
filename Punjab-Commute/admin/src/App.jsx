// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import AdminDashboard from "./pages/AdminDashboard";
import ManageBuses from "./pages/ManageBuses";
import ManageRoutes from "./pages/ManageRoutes";
import AdminUsers from "./pages/AdminUsers";
import RouteDetails from "./pages/RouteDetails";   // ⬅️ add this
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import AdminDrivers from "./pages/AdminDrivers";
import LiveRoutes from "./pages/LiveRoutes"; // ⬅️ add this

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignup />} />

        {/* Admin pages (protected) */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/buses"
          element={
            <ProtectedAdminRoute>
              <ManageBuses />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/routes"
          element={
            <ProtectedAdminRoute>
              <ManageRoutes />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedAdminRoute>
              <AdminUsers />
            </ProtectedAdminRoute>
          }
        />

        {/* Route details with map */}
        <Route
          path="/admin/routes/:id"
          element={
            <ProtectedAdminRoute>
              <RouteDetails />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/live-routes"
          element={
            <ProtectedAdminRoute>
              <LiveRoutes />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/drivers"
          element={
            <ProtectedAdminRoute>
              <AdminDrivers />
            </ProtectedAdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
