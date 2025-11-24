// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBuses: 0,
    totalRoutes: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const busCount = await axios.get('/api/bus/count');
        const routeCount = await axios.get('/api/routes/count');
        const userCount = await axios.get('/api/users/count');

        setStats({
          totalBuses: busCount.data,
          totalRoutes: routeCount.data,
          totalUsers: userCount.data,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>
      <div className="stats">
        <div className="stat-item">
          <h3>Total Buses</h3>
          <p>{stats.totalBuses}</p>
        </div>
        <div className="stat-item">
          <h3>Total Routes</h3>
          <p>{stats.totalRoutes}</p>
        </div>
        <div className="stat-item">
          <h3>Total Users</h3>
          <p>{stats.totalUsers}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
