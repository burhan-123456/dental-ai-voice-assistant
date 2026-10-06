import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Calendar, X, RefreshCcw, Clock, AlertCircle } from 'lucide-react';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });

  const load = () => {
    setLoading(true);
    api.getMyAppointments().then(setAppointments).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = appointments.filter(a => a.appointment_date >= today && !['cancelled', 'completed', 'rescheduled'].includes(a.status));
  const past = appointments.filter(a => a.appointment_date < today || ['completed', 'cancelled', 'rescheduled'].includes(a.status));
  const displayed = tab === 'upcoming' ? upcoming : past;

  const formatDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (t) => {
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  const cancelAppointment = async (id) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.updateAppointmentStatus(id, { status: 'cancelled', cancellation_reason: 'Cancelled by patient' });
      toast.success('Appointment cancelled');
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleReschedule = async () => {
    if (!rescheduleData.date || !rescheduleData.time) {
      toast.error('Please select date and time');
      return;
    }
    try {
      await api.rescheduleAppointment(rescheduleModal.id, rescheduleData);
      toast.success('Appointment rescheduled');
      setRescheduleModal(null);
      load();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Appointments</h1>
          <p className="page-subtitle">Manage your dental visits</p>
        </div>
      </div>

      <div className="page-body">
        <div className="tabs">
          <button className={`tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
            Upcoming ({upcoming.length})
          </button>
          <button className={`tab ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>
            Past ({past.length})
          </button>
        </div>

        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /></div>
        ) : displayed.length > 0 ? (
          <div className="appointment-list">
            {displayed.map(appt => (
              <div className="appointment-item" key={appt.id}>
                <div className="appt-time-badge">
                  <span className="time">{formatTime(appt.appointment_time)}</span>
                  <span className="date">{formatDate(appt.appointment_date)}</span>
                </div>
                <div className="appt-info">
                  <h4>{appt.dentist_name}</h4>
                  <p>{appt.service_name || appt.specialization} {appt.consultation_fee ? `• ₹${appt.consultation_fee}` : ''}</p>
                  {appt.treatment_notes && (
                    <p style={{ marginTop: 4, color: 'var(--primary-600)', fontSize: '0.8125rem' }}>
                      📋 {appt.treatment_notes}
                    </p>
                  )}
                </div>
                <span className={`badge badge-${appt.status}`}>{appt.status}</span>
                {tab === 'upcoming' && appt.status !== 'cancelled' && (
                  <div className="appt-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => { setRescheduleModal(appt); setRescheduleData({ date: '', time: '' }); }}>
                      <RefreshCcw size={14} /> Reschedule
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => cancelAppointment(appt.id)}>
                      <X size={14} /> Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><Calendar size={32} /></div>
            <h3>No {tab} appointments</h3>
            <p>{tab === 'upcoming' ? 'Book a new appointment to get started' : 'Your appointment history will appear here'}</p>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="modal-overlay" onClick={() => setRescheduleModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Reschedule Appointment</h3>
              <button className="btn-icon btn-ghost" onClick={() => setRescheduleModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                Current: {formatDate(rescheduleModal.appointment_date)} at {formatTime(rescheduleModal.appointment_time)} with {rescheduleModal.dentist_name}
              </p>
              <div className="form-group">
                <label className="form-label">New Date</label>
                <input type="date" className="form-input" min={today}
                  value={rescheduleData.date} onChange={e => setRescheduleData({ ...rescheduleData, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">New Time</label>
                <input type="time" className="form-input"
                  value={rescheduleData.time} onChange={e => setRescheduleData({ ...rescheduleData, time: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setRescheduleModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReschedule}>Reschedule</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
