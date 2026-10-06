import { useState, useEffect } from 'react';
import api from '../../api';
import { Calendar } from 'lucide-react';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', status: '', dentist_id: '' });

  const load = () => {
    setLoading(true);
    api.getAllAppointments(filters)
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.getAdminDentists().then(setDentists).catch(console.error);
  }, []);

  useEffect(() => { load(); }, [filters]);

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
          <h1 className="page-title">All Appointments</h1>
          <p className="page-subtitle">Monitor clinic appointments</p>
        </div>
      </div>

      <div className="page-body">
        <div className="filter-bar card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Date</label>
            <input type="date" className="form-input" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Dentist</label>
            <select className="form-select" value={filters.dentist_id} onChange={e => setFilters({ ...filters, dentist_id: e.target.value })}>
              <option value="">All Dentists</option>
              {dentists.map(d => <option key={d.dentist_id} value={d.dentist_id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Status</label>
            <select className="form-select" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button className="btn btn-ghost" onClick={() => setFilters({ date: '', status: '', dentist_id: '' })}>Clear Filters</button>
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
                      <th>Dentist</th>
                      <th>Service & Fee</th>
                      <th>Status</th>
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
                          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{a.patient_email}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{a.dentist_name}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{a.specialization}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{a.service_name || 'General'}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>₹{a.service_price || '-'}</div>
                        </td>
                        <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><Calendar size={32} /></div>
                <h3>No appointments found</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
