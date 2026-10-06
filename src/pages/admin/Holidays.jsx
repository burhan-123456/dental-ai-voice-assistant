import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Plus, X, Trash2, CalendarDays } from 'lucide-react';

export default function AdminHolidays() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: '', reason: '' });

  const load = () => {
    setLoading(true);
    api.getHolidays().then(setHolidays).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.addHoliday(form);
      toast.success('Holiday added');
      setModal(false);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this holiday?')) return;
    try {
      await api.deleteHoliday(id);
      toast.success('Holiday removed');
      load();
    } catch (err) { toast.error(err.message); }
  };

  const today = new Date().toISOString().split('T')[0];
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Holidays</h1>
          <p className="page-subtitle">Configure clinic closure dates</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ date: '', reason: '' }); setModal(true); }}>
          <Plus size={18} /> Add Holiday
        </button>
      </div>

      <div className="page-body">
        <div className="card" style={{ maxWidth: 800 }}>
          <div className="card-body">
            {loading ? (
              <div className="loading-container"><div className="loading-spinner" /></div>
            ) : holidays.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reason</th>
                      <th style={{ width: 80 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.map(h => (
                      <tr key={h.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{formatDate(h.date)}</div>
                          {h.date < today && <span className="badge badge-inactive" style={{ marginTop: 4 }}>Past</span>}
                        </td>
                        <td>{h.reason}</td>
                        <td>
                          <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger-600)' }} onClick={() => handleDelete(h.id)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><CalendarDays size={32} /></div>
                <h3>No holidays configured</h3>
                <p>The clinic is open on all scheduled working days</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Holiday</h3>
              <button className="btn-icon btn-ghost" onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
                  Adding a holiday will block all new appointments for this date.
                </p>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" required min={today}
                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <input type="text" className="form-input" required placeholder="e.g. Diwali, Clinic Renovation"
                    value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Holiday</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
