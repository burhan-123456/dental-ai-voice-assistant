import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function DentistDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    api.getDentistAppointments().then(setAppointments).catch(console.error).finally(() => setLoading(false));
  }, []);

  const pending = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed');
  const completed = appointments.filter(a => a.status === 'completed');
  const todaysAppts = appointments.filter(a => a.appointment_date === today);

  const formatTime = (t) => {
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, Dr. {user?.name?.split(' ').slice(1).join(' ') || user?.name}! 👋</h1>
          <p className="page-subtitle">Here's your schedule for today</p>
        </div>
      </div>
      <div className="page-body">
        <div className="stat-grid">
          <div className="stat-card primary">
            <div className="stat-icon primary"><Calendar size={24} /></div>
            <div><div className="stat-value">{todaysAppts.length}</div><div className="stat-label">Today's Appointments</div></div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon warning"><AlertCircle size={24} /></div>
            <div><div className="stat-value">{pending.length}</div><div className="stat-label">Pending</div></div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon success"><CheckCircle size={24} /></div>
            <div><div className="stat-value">{confirmed.length}</div><div className="stat-label">Confirmed</div></div>
          </div>
          <div className="stat-card accent">
            <div className="stat-icon accent"><Users size={24} /></div>
            <div><div className="stat-value">{completed.length}</div><div className="stat-label">Completed</div></div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Today's Schedule</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="loading-container"><div className="loading-spinner" /></div>
            ) : todaysAppts.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Patient</th>
                      <th>Service</th>
                      <th>Contact</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaysAppts.map(a => (
                      <tr key={a.id}>
                        <td><strong>{formatTime(a.appointment_time)}</strong></td>
                        <td>{a.patient_name}</td>
                        <td>{a.service_name || 'General'}</td>
                        <td style={{ fontSize: '0.8125rem' }}>{a.patient_email}<br/>{a.patient_phone || '-'}</td>
                        <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><Calendar size={32} /></div>
                <h3>No appointments today</h3>
                <p>Enjoy your free time!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
