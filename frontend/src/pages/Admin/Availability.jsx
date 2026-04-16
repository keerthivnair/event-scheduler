import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function Availability() {
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [newScheduleName, setNewScheduleName] = useState('');
  
  const navigate = useNavigate();
  const daysMap = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (selectedScheduleId) {
      fetchAvailabilities();
      fetchOverrides();
    }
  }, [selectedScheduleId]);

  const fetchSchedules = async () => {
    try {
      const res = await api.get('/schedules');
      setSchedules(res.data);
      if (res.data.length > 0 && !selectedScheduleId) {
        setSelectedScheduleId(res.data[0].id);
      }
    } catch (e) { console.error(e); }
  };

  const fetchAvailabilities = async () => {
    try {
      const res = await api.get('/availability');
      // Filter by schedule_id if needed, but the current API returns all. 
      // Let's assume we filter here for simplicity or update backend.
      // Actually, let's just filter here for now.
      setAvailabilities(res.data.filter(a => a.schedule_id === selectedScheduleId));
    } catch (e) { console.error(e); }
  };

  const fetchOverrides = async () => {
    try {
      const res = await api.get(`/date_overrides/${selectedScheduleId}`);
      setOverrides(res.data);
    } catch (e) { console.error(e); }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!newScheduleName) return;
    try {
      const res = await api.post('/schedules', { name: newScheduleName });
      setNewScheduleName('');
      fetchSchedules();
      setSelectedScheduleId(res.data.id);
    } catch (e) { alert("Failed to create schedule"); }
  };

  const handleCreateAvail = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.post('/availability', {
        schedule_id: selectedScheduleId,
        day_of_week: parseInt(fd.get('day_of_week')),
        start_time: fd.get('start_time') + ":00",
        end_time: fd.get('end_time') + ":00",
        timezone: fd.get('timezone') || "Asia/Kolkata"
      });
      fetchAvailabilities();
    } catch (error) {
      alert(error.response?.data?.detail || "Could not save availability.");
    }
  };

  const handleCreateOverride = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const isUnavailable = fd.get('is_unavailable') === 'on';
    try {
      await api.post('/date_overrides', {
        schedule_id: selectedScheduleId,
        date: fd.get('date'),
        start_time: isUnavailable ? null : fd.get('start_time') + ":00",
        end_time: isUnavailable ? null : fd.get('end_time') + ":00",
        is_unavailable: isUnavailable
      });
      fetchOverrides();
    } catch (error) {
      alert("Could not save override.");
    }
  };

  const handleDeleteAvail = async (id) => {
    await api.delete(`/availability/${id}`);
    fetchAvailabilities();
  };

  const handleDeleteOverride = async (id) => {
    await api.delete(`/date_overrides/${id}`);
    fetchOverrides();
  };

  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
          <span>←</span> Back
        </button>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--blue-600)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          Home <span>→</span>
        </button>
      </div>

      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1>Availability Schedules</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage multiple sets of working hours.</p>
        </div>
        <form onSubmit={handleCreateSchedule} style={{ display: 'flex', gap: 8 }}>
          <input 
            type="text" 
            placeholder="New Schedule Name" 
            className="form-control" 
            style={{ width: 200 }} 
            value={newScheduleName}
            onChange={e => setNewScheduleName(e.target.value)}
          />
          <button className="btn btn-primary">Create</button>
        </form>
      </div>

      {/* Schedule Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 0 }}>
        {schedules.map(s => (
          <button 
            key={s.id}
            onClick={() => setSelectedScheduleId(s.id)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              fontWeight: 600,
              fontSize: 14,
              color: selectedScheduleId === s.id ? 'var(--blue-600)' : 'var(--gray-500)',
              borderBottom: selectedScheduleId === s.id ? '2px solid var(--blue-600)' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            {s.name} {s.is_default && '(Default)'}
          </button>
        ))}
      </div>

      {selectedScheduleId && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* Regular Availability */}
          <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card">
              <h2 style={{ marginBottom: 20 }}>Weekly Hours</h2>
              {availabilities.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No regular hours set for this schedule.</p> : null}
              {availabilities.sort((a,b) => a.day_of_week - b.day_of_week).map(av => (
                <div key={av.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <strong>{daysMap[av.day_of_week]}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {av.start_time.substring(0,5)} - {av.end_time.substring(0,5)} ({av.timezone})
                    </div>
                  </div>
                  <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12, color: '#dc3545', borderColor: '#dc3545' }} onClick={() => handleDeleteAvail(av.id)}>
                    Remove
                  </button>
                </div>
              ))}
              
              <form onSubmit={handleCreateAvail} style={{ marginTop: 24, padding: 16, background: 'var(--gray-50)', borderRadius: 8 }}>
                <h4 style={{ marginBottom: 16 }}>Add Weekly Slot</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Day</label>
                    <select name="day_of_week" className="form-control" required defaultValue="0">
                      {daysMap.map((day, idx) => (
                        <option key={idx} value={idx}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start</label>
                    <input type="time" name="start_time" className="form-control" required defaultValue="09:00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End</label>
                    <input type="time" name="end_time" className="form-control" required defaultValue="17:00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Timezone</label>
                    <select name="timezone" className="form-control" required defaultValue="Asia/Kolkata">
                      <option value="Asia/Kolkata">IST (Kolkata)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">EST (New York)</option>
                    </select>
                  </div>
                </div>
                <button className="btn btn-primary" style={{ marginTop: 12, width: '100%' }}>Add Regular Hours</button>
              </form>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: 20 }}>Date Overrides</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>Override your regular hours for specific dates (e.g. holidays or one-off changes).</p>
              
              <div style={{ marginBottom: 20 }}>
                {overrides.length === 0 && <p style={{ fontSize: 14 }}>No overrides set.</p>}
                {overrides.map(ov => (
                  <div key={ov.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <strong>{new Date(ov.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</strong>
                      <div style={{ color: ov.is_unavailable ? '#dc3545' : 'var(--blue-600)', fontSize: 13 }}>
                        {ov.is_unavailable ? 'Unavailable' : `${ov.start_time.substring(0,5)} - ${ov.end_time.substring(0,5)}`}
                      </div>
                    </div>
                    <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleDeleteOverride(ov.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCreateOverride} style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 8 }}>
                <h4 style={{ marginBottom: 16 }}>Add Date Override</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input type="date" name="date" className="form-control" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start</label>
                    <input type="time" name="start_time" className="form-control" defaultValue="09:00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End</label>
                    <input type="time" name="end_time" className="form-control" defaultValue="17:00" />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 12 }}>
                  <input type="checkbox" name="is_unavailable" id="is_unav" />
                  <label htmlFor="is_unav" style={{ fontSize: 14 }}>Mark as Unavailable</label>
                </div>
                <button className="btn" style={{ width: '100%', background: '#1d3445', color: '#fff', padding: '12px', borderRadius: 8, fontWeight: 600, marginTop: 16 }}>Add Override</button>
              </form>
            </div>
          </div>

          <div className="card" style={{ flex: '1 1 300px' }}>
            <h2 style={{ marginBottom: 20 }}>Schedule Info</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              This schedule can be assigned to specific event types. 
              {selectedSchedule?.is_default ? " This is your default schedule used for all new events." : ""}
            </p>
            {!selectedSchedule?.is_default && (
               <button className="btn btn-outline" style={{ width: '100%', marginTop: 20, color: '#dc3545', borderColor: '#dc3545' }} onClick={async () => {
                 if (confirm("Delete this entire schedule?")) {
                   await api.delete(`/schedules/${selectedScheduleId}`);
                   setSelectedScheduleId(null);
                   fetchSchedules();
                 }
               }}>
                 Delete Schedule
               </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
