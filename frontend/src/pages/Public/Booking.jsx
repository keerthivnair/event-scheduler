import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import api from '../../api';

export default function Booking() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [eventType, setEventType] = useState(null);
  const [date, setDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [step, setStep] = useState(1); // 1: Date/Time, 2: Form, 3: Success
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/event_types/${slug}`).then(res => {
      setEventType(res.data);
      setLoading(false);
    }).catch(e => {
      setError('Event type not found');
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    if (date && eventType) {
      // Fetch available slots for this date
      const formattedDate = format(date, 'yyyy-MM-dd');
      api.get(`/slots?target_date=${formattedDate}&event_type_id=${eventType.id}`)
        .then(res => {
          setSlots(res.data);
          setSelectedSlot(null);
        });
    }
  }, [date, eventType]);

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // End time logic calculation from UI perspective (backend parses duration)
      // just pass end_time realistically by adding duration
      const startTimeParts = selectedSlot.split(':');
      const d = new Date(date);
      d.setHours(startTimeParts[0], startTimeParts[1], 0);
      d.setMinutes(d.getMinutes() + eventType.duration);
      const endTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;

      await api.post('/meetings', {
        event_type_id: eventType.id,
        invitee_name: formData.name,
        invitee_email: formData.email,
        date: formattedDate,
        start_time: selectedSlot,
        end_time: endTime
      });
      setStep(3);
    } catch (e) {
       alert(e.response?.data?.detail || 'Error booking appointment');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="fade-in" style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', padding: '1px' }}>
      <div className="booking-container">
        
        {/* Sidebar */}
        <div className="booking-sidebar">
          {step === 1 && (
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
              <span>←</span> Go Back
            </button>
          )}
          {step === 2 && (
             <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginBottom: 20, fontSize: 30 }}>
               ←
             </button>
          )}
          <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, marginBottom: 8, fontWeight: 700 }}>User</h4>
          <h1 style={{ fontSize: 28, marginBottom: 16 }}>{eventType.name}</h1>
          <div style={{ color: 'var(--text-muted)', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
              ⏱ {eventType.duration} min
            </div>
            {(date && selectedSlot) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, color: 'var(--primary-color)' }}>
                📅 {selectedSlot} - {format(date, 'EEEE, MMMM d, yyyy')}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
              🌍 Earth Time
            </div>
          </div>
          
          <p style={{ color: 'var(--text-main)', lineHeight: 1.6 }}>{eventType.description}</p>
        </div>

        {/* Content Area */}
        <div className="booking-content">
          {step === 1 && (
            <div>
              <h2 style={{ marginBottom: 24, fontSize: 20 }}>Select a Date & Time</h2>
              <div style={{ display: 'flex', gap: 40 }}>
                <div style={{ flex: '1 1 50%' }}>
                  <Calendar 
                    minDate={new Date()}
                    onChange={setDate} 
                    value={date} 
                  />
                </div>
                
                {date && (
                  <div style={{ flex: '1 1 50%' }}>
                    <div style={{ marginBottom: 16, color: 'var(--text-main)' }}>
                      {format(date, 'EEEE, MMMM d')}
                    </div>
                    <div className="slot-grid">
                      {slots.length === 0 ? <p>No slots available.</p> : null}
                      {slots.map(t => (
                        <div key={t} className="time-slot fade-in">
                          <button 
                            className={`slot-btn ${selectedSlot === t ? 'selected' : ''}`}
                            onClick={() => setSelectedSlot(t)}
                          >
                            {t.substring(0, 5)}
                          </button>
                          {selectedSlot === t && (
                            <button className="confirm-btn fade-in" onClick={() => setStep(2)}>
                              Next
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <h2 style={{ marginBottom: 24 }}>Enter Details</h2>
              <form onSubmit={handleBook}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    required 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div style={{ marginTop: 30 }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '14px 24px', fontSize: 16 }}>
                    Schedule Event
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="fade-in" style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: 64, height: 64, background: '#e0faeb', color: '#0f8243', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 24px' }}>
                ✓
              </div>
              <h2>You are scheduled</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>
                A calendar invitation has been sent to your email address.
              </p>
              <button className="btn btn-outline" style={{ marginTop: 40 }} onClick={() => navigate('/')}>
                Home
              </button>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
