import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import api from '../../api';

export default function Booking() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const rescheduleId = searchParams.get('reschedule_id');
  const navigate = useNavigate();
  
  const [eventType, setEventType] = useState(null);
  const [date, setDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [step, setStep] = useState(1); // 1: Date/Time, 2: Form, 3: Success
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [customResponses, setCustomResponses] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError('');
    
    // 1. Fetch Event Type
    api.get(`/event_types/${slug}`).then(res => {
      setEventType(res.data);
      if (!rescheduleId) setLoading(false);
    }).catch(e => {
      setError('Event type not found');
      setLoading(false);
    });

    // 2. If Rescheduling, Fetch Old Meeting
    if (rescheduleId) {
      api.get(`/meetings/${rescheduleId}`).then(res => {
        setFormData({ 
          name: res.data.invitee_name, 
          email: res.data.invitee_email 
        });
        setLoading(false);
      }).catch(e => {
        console.warn("Could not fetch old meeting", e);
        setLoading(false);
      });
    }
  }, [slug, rescheduleId]);

  useEffect(() => {
    if (date && eventType) {
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
        end_time: endTime,
        custom_responses: JSON.stringify(customResponses),
        rescheduled_from_id: rescheduleId ? parseInt(rescheduleId) : null
      });
      setStep(3);
    } catch (e) {
       alert(e.response?.data?.detail || 'Error booking appointment');
    }
  };

  const questions = eventType?.custom_questions ? eventType.custom_questions.split('\n').filter(q => q.trim()) : [];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 20 }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>Setting up your booking session...</p>
      </div>
    );
  }
  if (error) return <div style={{ textAlign: 'center', paddingTop: 100 }}><h2>{error}</h2><button onClick={() => navigate('/')} className="btn btn-outline" style={{ marginTop: 20 }}>Home</button></div>;

  return (
    <div className="fade-in" style={{ backgroundColor: '#f9f9f9', minHeight: '100vh', padding: '1px' }}>
      
      {rescheduleId && step < 3 && (
        <div style={{ backgroundColor: 'var(--blue-600)', color: 'white', padding: '12px', textAlign: 'center', fontWeight: 600, position: 'sticky', top: 0, zIndex: 100 }}>
          Rescheduling your session for {formData.name}
        </div>
      )}

      <div className="booking-container-wrapper" style={{ maxWidth: 1060, margin: '40px auto', padding: '0 20px' }}>
        <div className="booking-container" style={{ display: 'flex', backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.06)', overflow: 'hidden', minHeight: 'min(700px, 90vh)' }}>
          
          {/* Sidebar - Details */}
          <div className="booking-sidebar" style={{ width: '320px', padding: '40px', borderRight: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              {step === 1 && (
                <button 
                  onClick={() => navigate(-1)} 
                  style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                >
                  ← BACK
                </button>
              )}
              {step === 2 && (
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--blue-600)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  ← PREVIOUS
                </button>
              )}
              <button 
                onClick={() => navigate('/')} 
                style={{ background: 'none', border: 'none', color: 'var(--blue-600)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                DASHBOARD →
              </button>
            </div>
            
            <p style={{ color: '#888', fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>Invitee Session</p>
            <h1 style={{ fontSize: 26, marginBottom: 16, lineHeight: 1.2 }}>{eventType.name}</h1>
            
            <div style={{ color: '#555', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15 }}>
               <span style={{opacity: 0.6}}>⏱</span> {eventType.duration} min
              </div>
              {(date && selectedSlot) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15, color: 'var(--blue-600)' }}>
                  <span style={{opacity: 0.6}}>📅</span> {selectedSlot.substring(0,5)} - {format(date, 'MMM d, yyyy')}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15 }}>
                <span style={{opacity: 0.6}}>💻</span> Video Call
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13, color: '#888' }}>
                <span style={{opacity: 0.6}}>🌍</span> {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </div>
            </div>
            
            <p style={{ color: '#666', lineHeight: 1.6, fontSize: 14 }}>{eventType.description || 'Quick scheduling with just a few clicks.'}</p>
          </div>

          {/* Main Content Area */}
          <div className="booking-content" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
            {step === 1 && (
              <div style={{ width: '100%' }}>
                <h2 style={{ marginBottom: 32, fontSize: 22, fontWeight: 700 }}>Select Date & Time</h2>
                
                <div className="booking-layout-flex" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                  {/* Calendar Section */}
                  <div style={{ flex: '0 0 350px' }}>
                    <Calendar 
                      minDate={new Date()}
                      onChange={setDate} 
                      value={date} 
                      className="custom-calendar"
                    />
                  </div>
                  
                  {/* Slots Section */}
                  {date ? (
                    <div className="slots-side-panel" style={{ flex: 1, animation: 'fadeIn 0.3s ease' }}>
                      <div style={{ marginBottom: 20, fontSize: 15, fontWeight: 600, color: '#444' }}>
                        {format(date, 'EEEE, MMM d')}
                      </div>
                      <div className="slot-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, maxHeight: 450, overflowY: 'auto', paddingRight: 4 }}>
                        {slots.length === 0 ? (
                          <p style={{ textAlign: 'center', padding: '60px 0', color: '#999', background: '#fcfcfc', borderRadius: 8 }}>No slots available today.</p>
                        ) : null}
                        {slots.map(t => (
                          <div key={t} style={{ display: 'flex', gap: 8 }}>
                            <button 
                              className={`slot-btn ${selectedSlot === t ? 'selected' : ''}`}
                              onClick={() => setSelectedSlot(t)}
                              style={{ 
                                flex: 1, 
                                height: 52, 
                                fontSize: 15, 
                                fontWeight: 600, 
                                color: selectedSlot === t ? '#fff' : 'var(--blue-600)',
                                background: selectedSlot === t ? '#555' : 'transparent',
                                border: `1px solid ${selectedSlot === t ? '#555' : 'var(--blue-600)'}`,
                                borderRadius: 6,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              {t.substring(0, 5)}
                            </button>
                            {selectedSlot === t && (
                              <button 
                                className="confirm-btn fade-in" 
                                onClick={() => setStep(2)}
                                style={{ 
                                  flex: 1, 
                                  height: 52, 
                                  fontSize: 15, 
                                  fontWeight: 700, 
                                  background: 'var(--blue-600)', 
                                  color: '#fff', 
                                  border: 'none', 
                                  borderRadius: 6, 
                                  cursor: 'pointer' 
                                }}
                              >
                                CONFIRM
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, height: 350, border: '1px dashed #ddd', borderRadius: 8, color: '#aaa', fontSize: 14 }}>
                      Select a date to see availability
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="fade-in" style={{ maxWidth: 480, margin: '0 auto' }}>
                <h2 style={{ marginBottom: 30, fontSize: 24, fontWeight: 700 }}>Additional Info</h2>
                <form onSubmit={handleBook}>
                  {/* If rescheduling, we can hide or make these read-only */}
                  {!rescheduleId ? (
                    <>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>Full Name *</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          required 
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          placeholder="Your Name"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>Email Address *</label>
                        <input 
                          type="email" 
                          className="form-control" 
                          required 
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          placeholder="you@email.com"
                        />
                      </div>
                    </>
                  ) : (
                    <div style={{ background: '#f0f7ff', padding: 16, borderRadius: 8, marginBottom: 24, borderLeft: '4px solid var(--blue-600)' }}>
                      <div style={{ fontSize: 14, color: '#555' }}>Rescheduling for:</div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#222' }}>{formData.name} ({formData.email})</div>
                    </div>
                  )}

                  <div className="form-group" style={{ marginTop: 20 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 16, color: 'var(--gray-800)' }}>Notes or Questions for Host</label>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Please share anything that will help prepare for our meeting.</p>
                    <textarea 
                      className="form-control" 
                      style={{ 
                        height: 120, 
                        borderRadius: 12, 
                        padding: 16, 
                        fontSize: 15,
                        border: '1px solid #d1d9e0',
                        lineHeight: 1.6
                      }}
                      onChange={e => setCustomResponses({"Admin Note": e.target.value})}
                      placeholder="Type your message here..."
                    />
                  </div>

                  <div style={{ marginTop: 40 }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '16px 24px', fontSize: 16, width: '100%', borderRadius: 8, fontWeight: 700 }}>
                      {rescheduleId ? 'CONFIRM RESCHEDULE' : 'SCHEDULE EVENT'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="fade-in" style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ width: 80, height: 80, background: '#e0faeb', color: '#0f8243', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 32px' }}>
                  ✓
                </div>
                <h2 style={{ fontSize: 32, fontWeight: 800 }}>{rescheduleId ? 'Meeting Rescheduled!' : 'All Set!'}</h2>
                <p style={{ color: '#666', marginTop: 16, fontSize: 18, maxWidth: 400, margin: '20px auto' }}>
                  Confirmation details have been sent to <strong>{formData.email}</strong>.
                </p>
                <div style={{ marginTop: 48 }}>
                  <button className="btn btn-primary" style={{ width: 220, borderRadius: 8, padding: '14px 20px' }} onClick={() => navigate('/')}>
                    TO DASHBOARD
                  </button>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
