import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Link, useNavigate } from 'react-router-dom';

import './EventTypes.css';

export default function EventTypes() {
  const navigate = useNavigate();
  const [eventTypes, setEventTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', duration: 30, slug: '', description: '' });

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      const res = await api.get('/event_types');
      setEventTypes(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'name') {
      const slug = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setForm({ ...form, name: e.target.value, slug });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleCreateOrUpdate = async () => {
    try {
      if (form.id) {
        await api.put(`/event_types/${form.id}`, form);
      } else {
        await api.post('/event_types', form);
      }
      setShowModal(false);
      setForm({ name: '', duration: 30, slug: '', description: '' });
      fetchEventTypes();
    } catch (err) {
      console.error(err);
      alert('Failed to save event type');
    }
  };

  const handleEdit = (et) => {
    setForm(et);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this event type? All upcoming meetings for this event type will be cancelled and users will be notified by email.")) {
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
    setForm({ name: '', duration: 30, slug: '', description: '' });
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  return (
    <div className="et-root">

      <div className="et-page">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', marginBottom: 24, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
          <span>←</span> Go Back
        </button>
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
          {eventTypes.length === 0 ? (
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
          <div className="et-modal">

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
            <div className="et-modal-body">

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
                  <label className="et-label">Duration</label>
                  <div className="et-duration-pills">
                    {[15, 30, 45, 60].map(d => (
                      <button
                        key={d}
                        type="button"
                        className={`et-pill ${form.duration === d ? 'active' : ''}`}
                        onClick={() => setForm({ ...form, duration: d })}
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
                  <div className="et-duration-custom">
                    <label>Custom:</label>
                    <input
                      type="number"
                      value={form.duration}
                      min={5}
                      max={480}
                      onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 30 })}
                    />
                    <span style={{fontSize:13, color:'var(--gray-400)'}}>minutes</span>
                  </div>
                </div>

                {/* Slug */}
                <div className="et-field">
                  <label className="et-label">Booking Link</label>
                  <div className="et-slug-wrap">
                    <span className="et-slug-prefix">yourapp.com/book/</span>
                    <input
                      className="et-slug-input"
                      value={form.slug}
                      readOnly
                      placeholder="auto-generated"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="et-field">
                  <label className="et-label">Description <span style={{color:'var(--gray-400)', fontWeight:400}}>(optional)</span></label>
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
                    <span className="et-preview-tag">📹 1-on-1</span>
                    {form.slug && (
                      <span className="et-preview-tag">🔗 /{form.slug}</span>
                    )}
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
                {!form.id && (
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="7.5" y1="1" x2="7.5" y2="14"/><line x1="1" y1="7.5" x2="14" y2="7.5"/>
                  </svg>
                )}
                {form.id ? 'Save Changes' : 'Create Event Type'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
