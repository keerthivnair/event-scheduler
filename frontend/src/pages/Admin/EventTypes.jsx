import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import './EventTypes.css';

export default function EventTypes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [eventTypes, setEventTypes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    duration: 30, 
    slug: '', 
    description: '',
    buffer_before: 0,
    buffer_after: 0,
    schedule_id: null,
    custom_questions: ''
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchEventTypes(), fetchSchedules()]);
      setLoading(false);
    };
    loadData();
  }, [location.pathname]);

  const fetchEventTypes = async () => {
    try {
      const res = await api.get('/event_types');
      setEventTypes(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await api.get('/schedules');
      setSchedules(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setForm({ ...form, name: value, slug });
    } else {
      const val = (name === 'duration' || name === 'buffer_before' || name === 'buffer_after') 
                  ? parseInt(value) || 0 
                  : value;
      setForm({ ...form, [name]: val });
    }
  };

  const handleCreateOrUpdate = async () => {
    try {
      const data = { ...form };
      if (!data.schedule_id && schedules.length > 0) {
        data.schedule_id = schedules.find(s => s.is_default)?.id || schedules[0].id;
      }

      if (form.id) {
        await api.put(`/event_types/${form.id}`, data);
      } else {
        await api.post('/event_types', data);
      }
      setShowModal(false);
      resetForm();
      fetchEventTypes();
    } catch (err) {
      console.error(err);
      alert('Failed to save event type');
    }
  };

  const resetForm = () => {
    setForm({ 
      name: '', 
      duration: 30, 
      slug: '', 
      description: '',
      buffer_before: 0,
      buffer_after: 0,
      schedule_id: schedules.find(s => s.is_default)?.id || null,
      custom_questions: ''
    });
  };

  const handleEdit = (et) => {
    setForm({
      ...et,
      buffer_before: et.buffer_before || 0,
      buffer_after: et.buffer_after || 0,
      custom_questions: et.custom_questions || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this event type? All upcoming meetings for this event type will be cancelled.")) {
      try {
        await api.delete(`/event_types/${id}`);
        fetchEventTypes();
      } catch (err) {
        console.error(err);
        alert('Failed to delete event type');
      }
    }
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  return (
    <div className="et-root">

      <div className="et-page">
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
            <span>←</span> Back
          </button>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--blue-600)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            Home <span>→</span>
          </button>
        </div>
        {/* ── Header ── */}
        <div className="et-header">
          <div className="et-header-text">
            <h1>Event Types</h1>
            <p>{eventTypes.length} event{eventTypes.length !== 1 ? 's' : ''} configured</p>
          </div>
          <button className="et-btn-new" onClick={openModal}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="8" y1="2" x2="8" y2="14" /><line x1="2" y1="8" x2="14" y2="8" />
            </svg>
            New Event Type
          </button>
        </div>

        {/* ── Grid ── */}
        <div className="et-grid">
          {loading ? (
             <div className="et-empty" style={{ gridColumn: '1 / -1', padding: '100px 0' }}>
               <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
               <h3>Fetching your events...</h3>
               <p>This may take a moment if the database is waking up.</p>
             </div>
          ) : eventTypes.length === 0 ? (
            <div className="et-empty">
              <div className="et-empty-icon">📅</div>
              <h3>No event types yet</h3>
              <p>Create your first event type and share your booking link with others.</p>
            </div>
          ) : (
            eventTypes.map(et => (
              <div key={et.id} className="et-card">
                <div className="et-card-dot" />
                <h3 className="et-card-title">{et.name}</h3>
                <div className="et-card-meta">
                  <span className="et-card-pill">⏱ {et.duration} min</span>
                  <span className="et-card-pill-gray">1-on-1</span>
                </div>
                <p className="et-card-desc">{et.description || 'No description provided.'}</p>
                <div className="et-card-divider" />
                <div className="et-card-footer">
                  <span className="et-card-slug">/{et.slug}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(et)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--blue-600)', fontSize: '13px', fontWeight: '500' }}>Edit</button>
                    <button onClick={() => handleDelete(et.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#c62828', fontSize: '13px', fontWeight: '500' }}>Delete</button>
                    <Link to={`/book/${et.slug}`} className="et-card-link" style={{ marginLeft: 8 }}>
                      View →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <>
          <div className="et-modal-overlay" onClick={closeModal} />
          <div className="et-modal" style={{ maxWidth: 900 }}>

            {/* Header */}
            <div className="et-modal-header">
              <div className="et-modal-header-left">
                <div className="et-modal-logo">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
                    <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
                    <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
                    <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.3"/>
                  </svg>
                </div>
                <h2>{form.id ? 'Edit Event Type' : 'New Event Type'}</h2>
              </div>
              <button className="et-modal-close" onClick={closeModal}>✕</button>
            </div>

            {/* Body */}
            <div className="et-modal-body" style={{ overflowY: 'auto', maxHeight: '70vh' }}>

              {/* ── Form Side ── */}
              <div className="et-modal-form">
                <div>
                  <p className="et-form-section-title">Event Details</p>
                  <p className="et-form-section-sub">Set up how people will book time with you.</p>
                </div>

                {/* Name */}
                <div className="et-field">
                  <label className="et-label">Event Name</label>
                  <input
                    name="name"
                    className="et-input"
                    placeholder="e.g. 30 Min Intro Call"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>

                {/* Duration */}
                <div className="et-field">
                  <label className="et-label">Duration (minutes)</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      type="number"
                      name="duration"
                      className="et-input"
                      style={{ width: 80 }}
                      value={form.duration}
                      onChange={handleChange}
                    />
                    <span style={{ fontSize: 13, color: '#666' }}>min per session</span>
                  </div>
                </div>

                {/* Buffer */}
                <div className="et-field" style={{ background: 'rgba(0, 107, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(0, 107, 255, 0.1)' }}>
                  <label className="et-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    🛡️ Buffer Time 
                  </label>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Time Before Meeting (min)</label>
                      <input type="number" name="buffer_before" className="et-input" value={form.buffer_before} onChange={handleChange} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#5c6e7e', lineHeight: 1.5 }}>
                    <strong>What is Buffer?</strong> It's a "cushion" of free time added before your call. 
                    If you set 10 mins, no one can book you 10 mins before your next meeting starts, 
                    giving you time to prep or take a break! 🚀
                  </div>
                </div>

                {/* Schedule Selection */}
                <div className="et-field">
                  <label className="et-label">Availability Schedule</label>
                  <select name="schedule_id" className="et-input" value={form.schedule_id || ''} onChange={handleChange}>
                    <option value="">Select a schedule</option>
                    {schedules.map(s => (
                      <option key={s.id} value={s.id}>{s.name} {s.is_default && '(Default)'}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Questions */}
                <div className="et-field">
                  <label className="et-label">Custom Questions <span style={{color:'var(--gray-400)', fontWeight:400}}>(One per line)</span></label>
                  <textarea
                    name="custom_questions"
                    className="et-input et-textarea"
                    placeholder="e.g. What is your company name?&#10;What would you like to discuss?"
                    value={form.custom_questions}
                    onChange={handleChange}
                    style={{ height: 80 }}
                  />
                </div>

                {/* Description */}
                <div className="et-field">
                  <label className="et-label">Description</label>
                  <textarea
                    name="description"
                    className="et-input et-textarea"
                    placeholder="Briefly describe this event..."
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* ── Preview Side ── */}
              <div className="et-preview-side">
                <span className="et-preview-label">Live Preview</span>
                <div className="et-preview-card">
                  <div className="et-preview-card-header">
                    <div className="et-preview-avatar">
                      {form.name ? form.name[0].toUpperCase() : 'Y'}
                    </div>
                    <div className="et-preview-user-info">
                      <small>Booking with</small>
                      <span>You</span>
                    </div>
                  </div>

                  <h3 className="et-preview-event-name">
                    {form.name || 'Event Name'}
                  </h3>

                  <div className="et-preview-tags">
                    <span className="et-preview-tag">⏱ {form.duration} min</span>
                    {form.buffer_before > 0 && <span className="et-preview-tag">🛡️ {form.buffer_before}m buf</span>}
                    <span className="et-preview-tag">📹 1-on-1</span>
                  </div>

                  <p className="et-preview-desc">
                    {form.description || 'Your event description will appear here...'}
                  </p>

                  <button className="et-preview-cta">Book a Time →</button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="et-modal-footer">
              <button className="et-btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="et-btn-create" onClick={handleCreateOrUpdate}>
                {form.id ? 'Save Changes' : 'Create Event Type'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
