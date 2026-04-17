import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [sentIds, setSentIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchMeetings();
      setLoading(false);
    };
    init();
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
    if (confirm("Are you sure you want to cancel this meeting? A cancellation email will be sent to the invitee automatically.")) {
      try {
        await api.post(`/meetings/${id}/cancel`);
        fetchMeetings();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const now = new Date();
  
  const filteredMeetings = meetings.filter(m => {
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
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
          <span>←</span> Back
        </button>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--blue-600)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          Home <span>→</span>
        </button>
      </div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h1>Meetings</h1>
      </div>

      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--gray-200)', marginBottom: '24px', overflowX: 'auto' }}>
        {['Upcoming', 'Past', 'Canceled'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())} 
            style={{ 
              padding: '12px 0', 
              border: 'none', 
              background: 'transparent', 
              cursor: 'pointer', 
              fontSize: '15px', 
              fontWeight: activeTab === tab.toLowerCase() ? '600' : '400', 
              color: activeTab === tab.toLowerCase() ? 'var(--blue-600)' : 'var(--gray-500)', 
              borderBottom: activeTab === tab.toLowerCase() ? '2_px solid var(--blue-600)' : '2px solid transparent' 
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="card" style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
            <p style={{ color: 'var(--text-muted)' }}>Fetching meetings...</p>
          </div>
        ) : filteredMeetings.length === 0 ? <p style={{ padding: 20, color: 'var(--gray-500)' }}>No {activeTab} meetings found.</p> : 
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Time & Date</th>
              <th style={{ padding: 12 }}>Invitee</th>
              <th style={{ padding: 12 }}>Event Type</th>
              <th style={{ padding: 12 }}>Custom Responses</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Admin Response</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMeetings.map(m => {
              let responses = {};
              try { if (m.custom_responses) responses = JSON.parse(m.custom_responses); } catch(e){}
              
              return (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600 }}>{m.date}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{m.start_time.substring(0,5)}</div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontWeight: 500 }}>{m.invitee_name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{m.invitee_email}</div>
                  </td>
                  <td style={{ padding: 12 }}>
                    {m.event_type?.name || 'Deleted Event'}
                  </td>
                  <td style={{ padding: 12, fontSize: 12, maxWidth: 200 }}>
                    {Object.entries(responses).map(([q, r]) => (
                      <div key={q} style={{ marginBottom: 4 }}>
                        <strong>{q}:</strong> {r}
                      </div>
                    ))}
                    {Object.keys(responses).length === 0 && <span style={{color:'var(--gray-400)'}}>N/A</span>}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: 12, 
                      fontSize: 11, 
                      background: m.status === 'canceled' ? '#ffebee' : '#e0faeb',
                      color: m.status === 'canceled' ? '#c62828' : '#0f8243',
                      fontWeight: 700
                    }}>
                      {m.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '24px 12px' }}>
                    {m.admin_notes || sentIds.includes(m.id) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ color: '#0f8243', fontWeight: 700, fontSize: 11, background: '#e0faeb', padding: '4px 8px', borderRadius: 6, display: 'inline-block', width: 'fit-content' }}>
                          ✅ SENT RESPONSE
                        </div>
                        <div style={{ fontSize: 12, color: '#444', background: '#f8f9fa', padding: 10, borderRadius: 8, border: '1px solid #eee', marginTop: 4, lineHeight: 1.4 }}>
                          {m.admin_notes || "Response sent successfully."}
                        </div>
                      </div>
                    ) : (
                      m.custom_responses && m.custom_responses !== '{}' && m.custom_responses !== '[]' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <textarea 
                            key={m.id}
                            placeholder="Type your reply here..." 
                            id={`note-${m.id}`}
                            style={{ fontSize: 11, padding: 8, borderRadius: 6, border: '1px solid #ddd', width: 180, height: 60 }} 
                          />
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '6px 12px', fontSize: 10, fontWeight: 600 }}
                            onClick={async () => {
                               const el = document.getElementById(`note-${m.id}`);
                               const val = el.value;
                               if(!val) return;
                               await api.post(`/meetings/${m.id}/notes`, { notes: val });
                               setSentIds([...sentIds, m.id]);
                               fetchMeetings(); // Refresh to show the saved note properly
                            }}
                          >
                            Send Response
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>No notes provided</span>
                      )
                    )}
                  </td>
                  <td style={{ padding: '24px 12px' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {m.status !== 'canceled' && (
                        <>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '8px 14px', fontSize: 12 }} 
                            onClick={() => navigate(`/book/${m.event_type?.slug}?reschedule_id=${m.id}`)}
                          >
                            Reschedule
                          </button>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '8px 14px', fontSize: 12, color: '#dc3545', borderColor: '#dc3545' }} 
                            onClick={() => handleCancel(m.id)}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        }
      </div>
    </div>
  );
}
