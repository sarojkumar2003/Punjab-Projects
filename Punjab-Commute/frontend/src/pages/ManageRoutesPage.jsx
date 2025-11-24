// src/pages/ManageRoutesPage.js
import React from 'react';
import AdminSidebar from '../components/AdminSidebar';
import RouteList from '../components/RouteList';

const ManageRoutesPage = () => {
  return (
    <div className="manage-routes-page">
      <AdminSidebar />
      <main className="main-content">
        <h1>Manage Routes</h1>
        <RouteList />
      </main>
    </div>
  );
};

export default ManageRoutesPage;
