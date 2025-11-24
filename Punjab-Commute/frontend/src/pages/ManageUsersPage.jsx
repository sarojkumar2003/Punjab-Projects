// src/pages/ManageUsersPage.js
import React from 'react';
import AdminSidebar from '../components/AdminSidebar';
import UserList from '../components/UserList';

const ManageUsersPage = () => {
  return (
    <div className="manage-users-page">
      <AdminSidebar />
      <div className="main-content">
        <h1>Manage Users</h1>
        <UserList />
      </div>
    </div>
  );
};

export default ManageUsersPage;
