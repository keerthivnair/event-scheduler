import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function Availability() {
  const [availabilities, setAvailabilities] = useState([]);
  const navigate = useNavigate();
  
  const daysMap = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchAvailabilities();
  }, []);

  const fetchAvailabilities = async () => {
    try {
      const res = await api.get('/availability');
      setAvailabilities(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api.post('/availability', {
      day_of_week: parseInt(fd.get('day_of_week')),
      start_time: fd.get('start_time') + ":00",
      end_time: fd.get('end_time') + ":00",
      timezone: fd.get('timezone') || "UTC"
    });
    fetchAvailabilities();
  };

  const handleDelete = async (id) => {
    await api.delete(`/availability/${id}`);
    fetchAvailabilities();
  };

  return (
    <div className="fade-in">
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', marginBottom: 16, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
        <span>←</span> Go Back
      </button>
      <div className="page-header">
        <h1>Availability Settings</h1>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        <div className="card" style={{ flex: '1 1 300px' }}>
          <h2 style={{ marginBottom: 20 }}>Current Schedule</h2>
          {availabilities.length === 0 ? <p>No availability set.</p> : null}
          {availabilities.map(av => (
            <div key={av.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <strong>{daysMap[av.day_of_week]}</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  {av.start_time.substring(0,5)} - {av.end_time.substring(0,5)} ({av.timezone})
                </div>
              </div>
              <button className="btn btn-outline" style={{ padding: '6px 12px', color: '#dc3545', borderColor: '#dc3545' }} onClick={() => handleDelete(av.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>

        <div className="card" style={{ flex: '1 1 300px' }}>
          <h2 style={{ marginBottom: 20 }}>Add Availability</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Day of Week</label>
              <select name="day_of_week" className="form-control" required defaultValue="0">
                {daysMap.map((day, idx) => (
                  <option key={idx} value={idx}>{day}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input type="time" name="start_time" className="form-control" required defaultValue="09:00" />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input type="time" name="end_time" className="form-control" required defaultValue="17:00" />
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select name="timezone" className="form-control" required defaultValue="UTC">
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="America/Chicago">Central Time (US & Canada)</option>
                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Central European Time</option>
                <option value="Asia/Kolkata">India Standard Time</option>
                <option value="Asia/Tokyo">Japan Standard Time</option>
                <option value="Australia/Sydney">Australian Eastern Time</option>
              </select>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Add Time Slot</button>
          </form>
        </div>

      </div>
    </div>
  );
}
