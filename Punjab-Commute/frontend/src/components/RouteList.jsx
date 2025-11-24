// src/components/RouteList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RouteList = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null);    // Error state

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await axios.get('/api/routes');
        setRoutes(response.data);
      } catch (error) {
        console.error('Error fetching routes:', error);
        setError('Failed to load routes'); // Set error message
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };
    fetchRoutes();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Loading indicator
  }

  if (error) {
    return <div>{error}</div>; // Display error if there's one
  }

  return (
    <div className="route-list">
      <h2>List of Routes</h2>
      <table>
        <thead>
          <tr>
            <th>Route Name</th>
            <th>Directions</th>
            <th>Stops</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((route) => (
            <tr key={route._id}>
              <td>{route.routeName}</td>
              <td>{route.directions}</td>
              <td>{route.stops.length} Stops</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RouteList;
