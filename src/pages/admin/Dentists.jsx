import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Stethoscope, Plus, X, Edit, Trash2 } from 'lucide-react';

export default function AdminDentists() {
  const [dentists, setDentists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', specialization: '', qualification: '', experience_years: 0, consultation_fee: 500, bio: '' });

  const load = () => {
    setLoading(true);
    api.getAdminDentists().then(setDentists).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await api.addDentist(form);
        toast.success('Dentist added');
      } else {
        await api.updateDentist(modal.dentist_id, form);
        toast.success('Dentist updated');
      }
      setModal(null);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to deactivate this dentist?')) return;
    try {
      await api.deleteDentist(id);
      toast.success('Dentist deactivated');
      load();
    } catch (err) { toast.error(err.message); }
  };

  const openAdd = () => {
    setForm({ name: '', email: '', password: '', phone: '', specialization: '', qualification: '', experience_years: 0, consultation_fee: 500, bio: '' });
    setModal('add');
  };

  const openEdit = (d) => {
    setForm({ ...d });
    setModal(d);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Dentists</h1>
          <p className="page-subtitle">Add and manage dental staff</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Dentist</button>
      </div>

      <div className="page-body">
        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="loading-container"><div className="loading-spinner" /></div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Dentist</th>
                      <th>Specialization</th>
                      <th>Experience</th>
                      <th>Fee</th>
                      <th>Appts</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dentists.map(d => (
                      <tr key={d.dentist_id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{d.name}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{d.email}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{d.specialization}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{d.qualification}</div>
                        </td>
                        <td>{d.experience_years} yrs</td>
                        <td>₹{d.consultation_fee}</td>
                        <td>{d.appointment_count}</td>
                        <td><span className={`badge badge-${d.is_active ? 'active' : 'inactive'}`}>{d.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-sm btn-ghost" onClick={() => openEdit(d)}><Edit size={16} /></button>
                            {d.is_active === 1 && <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger-600)' }} onClick={() => handleDelete(d.dentist_id)}><Trash2 size={16} /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'add' ? 'Add Dentist' : 'Edit Dentist'}</h3>
              <button className="btn-icon btn-ghost" onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input type="text" className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={modal !== 'add'} />
                  </div>
                </div>
                {modal === 'add' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input type="password" className="form-input" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input type="tel" className="form-input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Specialization</label>
                    <input type="text" className="form-input" required value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Qualification</label>
                    <input type="text" className="form-input" value={form.qualification || ''} onChange={e => setForm({ ...form, qualification: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Experience (Years)</label>
                    <input type="number" className="form-input" min="0" value={form.experience_years} onChange={e => setForm({ ...form, experience_years: parseInt(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Consultation Fee (₹)</label>
                    <input type="number" className="form-input" min="0" value={form.consultation_fee} onChange={e => setForm({ ...form, consultation_fee: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea className="form-textarea" value={form.bio || ''} onChange={e => setForm({ ...form, bio: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{modal === 'add' ? 'Add Dentist' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
