import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { Calendar, Clock, Stethoscope, Bot, CalendarDays, ArrowRight, Activity } from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyAppointments()
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = appointments.filter(a => a.appointment_date >= today && !['cancelled', 'completed', 'rescheduled'].includes(a.status));
  const past = appointments.filter(a => a.appointment_date < today || ['completed'].includes(a.status));

  const formatDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (t) => {
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="page-subtitle">Here's your dental health overview</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/assistant')}>
          <Bot size={18} /> Talk to AI Assistant
        </button>
      </div>

      <div className="page-body">
        <div className="stat-grid">
          <div className="stat-card primary" onClick={() => navigate('/appointments')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon primary"><Calendar size={24} /></div>
            <div>
              <div className="stat-value">{upcoming.length}</div>
              <div className="stat-label">Upcoming Appointments</div>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon success"><Activity size={24} /></div>
            <div>
              <div className="stat-value">{past.length}</div>
              <div className="stat-label">Completed Visits</div>
            </div>
          </div>
          <div className="stat-card accent" onClick={() => navigate('/assistant')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon accent"><Bot size={24} /></div>
            <div>
              <div className="stat-value">AI</div>
              <div className="stat-label">Voice Assistant</div>
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Upcoming Appointments</h3>
              <button className="btn btn-sm btn-outline" onClick={() => navigate('/appointments')}>
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="loading-container"><div className="loading-spinner" /></div>
              ) : upcoming.length > 0 ? (
                <div className="appointment-list">
                  {upcoming.slice(0, 4).map(appt => (
                    <div className="appointment-item" key={appt.id}>
                      <div className="appt-time-badge">
                        <span className="time">{formatTime(appt.appointment_time)}</span>
                        <span className="date">{formatDate(appt.appointment_date)}</span>
                      </div>
                      <div className="appt-info">
                        <h4>{appt.dentist_name}</h4>
                        <p>{appt.service_name || appt.specialization}</p>
                      </div>
                      <span className={`badge badge-${appt.status}`}>{appt.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon"><Calendar size={32} /></div>
                  <h3>No upcoming appointments</h3>
                  <p>Book your next dental visit today</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => navigate('/assistant')}>
                    Talk to AI
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[

                { icon: Bot, label: 'AI Voice Assistant', desc: 'Talk to our AI receptionist', path: '/assistant', color: 'accent' },
                { icon: Stethoscope, label: 'View Dentists', desc: 'See our dental team', path: '/dentists', color: 'success' },
                { icon: Clock, label: 'View Services', desc: 'Explore our dental services', path: '/services', color: 'warning' },
              ].map(action => (
                <div key={action.path} className="appointment-item" style={{ cursor: 'pointer' }}
                  onClick={() => navigate(action.path)}>
                  <div className={`stat-icon ${action.color}`}>
                    <action.icon size={20} />
                  </div>
                  <div className="appt-info">
                    <h4>{action.label}</h4>
                    <p>{action.desc}</p>
                  </div>
                  <ArrowRight size={18} color="var(--gray-400)" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
