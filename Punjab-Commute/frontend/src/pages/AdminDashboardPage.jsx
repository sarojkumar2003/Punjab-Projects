// src/pages/AdminDashboardPage.js
import React from 'react';
import AdminSidebar from '../components/AdminSidebar';
import Dashboard from '../components/Dashboard';

const AdminDashboardPage = () => {
  return (
    <div className="admin-dashboard-page">
      <AdminSidebar />
      <div className="main-content">
        <Dashboard />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
