import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import EventTypes from './pages/Admin/EventTypes';
import Availability from './pages/Admin/Availability';
import Meetings from './pages/Admin/Meetings';
import Booking from './pages/Public/Booking';
import Home from './pages/Public/Home';

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <nav className="admin-sidebar">
        <div className="logo-container">
          <div className="logo">S</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Slot It</h2>
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/admin/event-types">Event Types</Link>
          </li>
          <li>
            <Link to="/admin/availability">Availability</Link>
          </li>
          <li>
            <Link to="/admin/meetings">Meetings</Link>
          </li>
        </ul>
      </nav>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book/:slug" element={<Booking />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="event-types" element={<EventTypes />} />
          <Route path="availability" element={<Availability />} />
          <Route path="meetings" element={<Meetings />} />
          <Route index element={<EventTypes />} />
        </Route>
      </Routes>
      <Analytics />
    </Router>
  );
}

export default App;
