// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import AdminDashboard from "./pages/AdminDashboard";
import ManageBuses from "./pages/ManageBuses";
import ManageRoutes from "./pages/ManageRoutes";
import AdminUsers from "./pages/AdminUsers";
import RouteDetails from "./pages/RouteDetails";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import AdminDrivers from "./pages/AdminDrivers";
import LiveRoutes from "./pages/LiveRoutes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root: redirect to admin login (change target if you want a public home) */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

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

        {/* Fallback — unknown routes */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
