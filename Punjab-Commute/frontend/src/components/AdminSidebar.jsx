// src/components/AdminSidebar.js
import React from 'react';
import { Link } from 'react-router-dom';

const AdminSidebar = () => {
  return (
    <div className="sidebar">
      <h2>Admin Panel</h2>
      <nav>
        <ul>
          <li><Link to="/admin">Dashboard</Link></li>
          <li><Link to="/admin/manage-buses">Manage Buses</Link></li>
          <li><Link to="/admin/manage-routes">Manage Routes</Link></li>
          <li><Link to="/admin/manage-users">Manage Users</Link></li>
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;
