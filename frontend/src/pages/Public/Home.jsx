import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function Home() {
  const [eventTypes, setEventTypes] = useState([]);

  useEffect(() => {
    api.get('/event_types').then(res => setEventTypes(res.data));
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '60px auto', padding: '0 20px' }} className="fade-in">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, marginBottom: 10 }}>CalendlyClone</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 18 }}>Welcome! Please choose an event type below to book a time.</p>
        <Link to="/admin" style={{ display: 'inline-block', marginTop: 15 }} className="btn btn-outline">Go to Admin Dashboard</Link>
      </div>

      <div className="card shadow-md">
        <h2 style={{ paddingBottom: 20, borderBottom: '1px solid var(--border-color)', marginBottom: 20 }}>
          Available Events
        </h2>
        {eventTypes.length === 0 ? <p>No events available.</p> : null}
        {eventTypes.map(et => (
          <div key={et.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ fontSize: 18, color: 'var(--primary-color)' }}>{et.name}</h3>
              <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                {et.duration} min • {et.description}
              </div>
            </div>
            <Link to={`/book/${et.slug}`} className="btn btn-outline">Book</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
