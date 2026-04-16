import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await api.get('/meetings');
      setMeetings(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = async (id) => {
    if (confirm("Cancel this meeting?")) {
      await api.post(`/meetings/${id}/cancel`);
      fetchMeetings();
    }
  };

  const now = new Date();
  
  const filteredMeetings = meetings.filter(m => {
    // Creating standard valid string for Date parsing because times from DB could be 'HH:MM:SS'
    const meetingDateTime = new Date(`${m.date}T${m.start_time}`);
    if (activeTab === 'upcoming') {
      return meetingDateTime >= now && m.status !== 'canceled';
    } else if (activeTab === 'past') {
      return meetingDateTime < now && m.status !== 'canceled';
    } else {
      return m.status === 'canceled';
    }
  });

  return (
    <div className="fade-in">
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', marginBottom: 16, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
        <span>←</span> Go Back
      </button>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h1>Meetings</h1>
      </div>

      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--gray-200)', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('upcoming')} 
          style={{ padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '15px', fontWeight: activeTab === 'upcoming' ? '600' : '400', color: activeTab === 'upcoming' ? 'var(--blue-600)' : 'var(--gray-500)', borderBottom: activeTab === 'upcoming' ? '2px solid var(--blue-600)' : '2px solid transparent' }}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setActiveTab('past')} 
          style={{ padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '15px', fontWeight: activeTab === 'past' ? '600' : '400', color: activeTab === 'past' ? 'var(--blue-600)' : 'var(--gray-500)', borderBottom: activeTab === 'past' ? '2px solid var(--blue-600)' : '2px solid transparent' }}
        >
          Past
        </button>
        <button 
          onClick={() => setActiveTab('canceled')} 
          style={{ padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '15px', fontWeight: activeTab === 'canceled' ? '600' : '400', color: activeTab === 'canceled' ? 'var(--blue-600)' : 'var(--gray-500)', borderBottom: activeTab === 'canceled' ? '2px solid var(--blue-600)' : '2px solid transparent' }}
        >
          Canceled
        </button>
      </div>

      <div className="card" style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)' }}>
        {filteredMeetings.length === 0 ? <p style={{ color: 'var(--gray-500)' }}>No {activeTab} meetings found.</p> : 
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Date</th>
              <th style={{ padding: 12 }}>Time</th>
              <th style={{ padding: 12 }}>Invitee Name</th>
              <th style={{ padding: 12 }}>Email</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredMeetings.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                <td style={{ padding: 12 }}>{m.date}</td>
                <td style={{ padding: 12 }}>{m.start_time.substring(0,5)}</td>
                <td style={{ padding: 12, fontWeight: 500 }}>{m.invitee_name}</td>
                <td style={{ padding: 12, color: 'var(--text-muted)' }}>{m.invitee_email}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: 12, 
                    fontSize: 12, 
                    background: m.status === 'canceled' ? '#ffebee' : '#e0faeb',
                    color: m.status === 'canceled' ? '#c62828' : '#0f8243',
                    fontWeight: 600
                  }}>
                    {m.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  {m.status !== 'canceled' && (
                    <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleCancel(m.id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        }
      </div>
    </div>
  );
}
