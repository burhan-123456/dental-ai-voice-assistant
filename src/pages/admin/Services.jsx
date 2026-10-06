import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Plus, X, Edit, Trash2 } from 'lucide-react';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', category: 'General', duration_minutes: 30, price: 500, is_active: 1 });

  const load = () => {
    setLoading(true);
    api.getServices().then(setServices).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await api.createService(form);
        toast.success('Service added');
      } else {
        await api.updateService(modal.id, form);
        toast.success('Service updated');
      }
      setModal(null);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to deactivate this service?')) return;
    try {
      await api.deleteService(id);
      toast.success('Service deactivated');
      load();
    } catch (err) { toast.error(err.message); }
  };

  const openAdd = () => {
    setForm({ name: '', description: '', category: 'General', duration_minutes: 30, price: 500, is_active: 1 });
    setModal('add');
  };

  const openEdit = (s) => {
    setForm({ ...s });
    setModal(s);
  };

  const categories = ['General', 'Preventive', 'Diagnostic', 'Restorative', 'Surgical', 'Cosmetic', 'Orthodontics', 'Pediatric'];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Services</h1>
          <p className="page-subtitle">Configure clinic services and pricing</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Service</button>
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
                      <th>Service Name</th>
                      <th>Category</th>
                      <th>Duration</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(s => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{s.name}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{s.description}</div>
                        </td>
                        <td>{s.category}</td>
                        <td>{s.duration_minutes} min</td>
                        <td>₹{s.price}</td>
                        <td><span className={`badge badge-${s.is_active ? 'active' : 'inactive'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-sm btn-ghost" onClick={() => openEdit(s)}><Edit size={16} /></button>
                            {s.is_active === 1 && <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger-600)' }} onClick={() => handleDelete(s.id)}><Trash2 size={16} /></button>}
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
              <h3 className="modal-title">{modal === 'add' ? 'Add Service' : 'Edit Service'}</h3>
              <button className="btn-icon btn-ghost" onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Service Name</label>
                  <input type="text" className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Duration (Minutes)</label>
                    <input type="number" className="form-input" min="5" step="5" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price (₹)</label>
                    <input type="number" className="form-input" min="0" value={form.price} onChange={e => setForm({ ...form, price: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                {modal !== 'add' && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.is_active} onChange={e => setForm({ ...form, is_active: parseInt(e.target.value) })}>
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{modal === 'add' ? 'Add Service' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
