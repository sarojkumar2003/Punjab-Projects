// src/components/BusList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BusList = () => {
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const response = await axios.get('/api/bus');
        setBuses(response.data);
      } catch (error) {
        console.error('Error fetching buses:', error);
      }
    };
    fetchBuses();
  }, []);

  return (
    <div className="bus-list">
      <h2>List of Buses</h2>
      <table>
        <thead>
          <tr>
            <th>Bus Number</th>
            <th>Route</th>
            <th>Status</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {buses.map((bus) => (
            <tr key={bus._id}>
              <td>{bus.busNumber}</td>
              <td>{bus.route}</td>
              <td>{bus.status}</td>
              <td>{new Date(bus.lastUpdated).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BusList;
