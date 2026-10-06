import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Calendar, Check, X, FileText } from 'lucide-react';

export default function DentistAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [notesModal, setNotesModal] = useState(null);
  const [notesText, setNotesText] = useState('');

  const load = () => {
    setLoading(true);
    api.getDentistAppointments(filterDate, filterStatus)
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterDate, filterStatus]);

  const updateStatus = async (id, status) => {
    try {
      await api.updateAppointmentStatus(id, { status });
      toast.success(`Appointment marked as ${status}`);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const saveNotes = async () => {
    try {
      await api.addTreatmentNotes(notesModal.id, { treatment_notes: notesText });
      toast.success('Notes saved successfully');
      setNotesModal(null);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const formatTime = (t) => {
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Appointments</h1>
          <p className="page-subtitle">View and update your appointments</p>
        </div>
      </div>

      <div className="page-body">
        <div className="filter-bar card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Date</label>
            <input type="date" className="form-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Status</label>
            <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button className="btn btn-ghost" onClick={() => { setFilterDate(''); setFilterStatus(''); }}>Clear Filters</button>
        </div>

        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="loading-container"><div className="loading-spinner" /></div>
            ) : appointments.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Patient</th>
                      <th>Service</th>
                      <th>Notes</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{formatTime(a.appointment_time)}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{formatDate(a.appointment_date)}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{a.patient_name}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{a.patient_phone || a.patient_email}</div>
                        </td>
                        <td>{a.service_name || 'General'}</td>
                        <td>
                          <button className="btn btn-sm btn-ghost" onClick={() => { setNotesModal(a); setNotesText(a.treatment_notes || ''); }} title="Treatment Notes">
                            <FileText size={16} color={a.treatment_notes ? 'var(--primary-600)' : 'var(--gray-400)'} />
                          </button>
                        </td>
                        <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {a.status === 'pending' && (
                              <button className="btn btn-sm btn-success" onClick={() => updateStatus(a.id, 'confirmed')}><Check size={14} /> Confirm</button>
                            )}
                            {a.status === 'confirmed' && (
                              <button className="btn btn-sm btn-primary" onClick={() => updateStatus(a.id, 'completed')}><Check size={14} /> Complete</button>
                            )}
                            {['pending', 'confirmed'].includes(a.status) && (
                              <button className="btn btn-sm btn-danger" onClick={() => updateStatus(a.id, 'cancelled')}><X size={14} /> Cancel</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><Calendar size={32} /></div>
                <h3>No appointments found</h3>
                <p>Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes Modal */}
      {notesModal && (
        <div className="modal-overlay" onClick={() => setNotesModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Treatment Notes</h3>
              <button className="btn-icon btn-ghost" onClick={() => setNotesModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                <strong>Patient:</strong> {notesModal.patient_name}<br/>
                <strong>Date:</strong> {formatDate(notesModal.appointment_date)} {formatTime(notesModal.appointment_time)}
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" placeholder="Add diagnosis, prescription, or treatment details..."
                  value={notesText} onChange={e => setNotesText(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setNotesModal(null)}>Close</button>
              <button className="btn btn-primary" onClick={saveNotes}>Save Notes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
