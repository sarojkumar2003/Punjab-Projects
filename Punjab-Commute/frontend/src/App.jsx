// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ManageBusesPage from './pages/ManageBusesPage';
import ManageRoutesPage from './pages/ManageRoutesPage';
import ManageUsersPage from './pages/ManageUsersPage';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/admin" component={AdminDashboardPage} />
        <Route path="/admin/manage-buses" component={ManageBusesPage} />
        <Route path="/admin/manage-routes" component={ManageRoutesPage} />
        <Route path="/admin/manage-users" component={ManageUsersPage} />
      </Switch>
    </Router>
  );
};

export default App;
