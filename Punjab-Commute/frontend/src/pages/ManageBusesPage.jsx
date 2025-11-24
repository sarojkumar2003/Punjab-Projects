// src/pages/ManageBusesPage.js
import React from 'react';
import AdminSidebar from '../components/AdminSidebar';
import BusList from '../components/BusList';

const ManageBusesPage = () => {
  return (
    <div className="manage-buses-page">
      <AdminSidebar />
      <div className="main-content">
        <h1>Manage Buses</h1>
        <BusList />
      </div>
    </div>
  );
};

export default ManageBusesPage;
