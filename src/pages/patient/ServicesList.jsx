import { useState, useEffect } from 'react';
import api from '../../api';
import { Clock, Search } from 'lucide-react';

export default function ServicesList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api.getServices().then(setServices).catch(console.error).finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(services.map(s => s.category))];
  const filtered = filter === 'All' ? services : services.filter(s => s.category === filter);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dental Services</h1>
          <p className="page-subtitle">{services.length} services available</p>
        </div>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat}
              className={`btn btn-sm ${filter === cat ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(cat)}>
              {cat}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /></div>
        ) : (
          <div className="service-grid">
            {filtered.map(s => (
              <div key={s.id} className="service-card">
                <span className="category">{s.category}</span>
                <h3>{s.name}</h3>
                <p className="description">{s.description}</p>
                <div className="meta">
                  <span className="price">₹{s.price.toLocaleString()}</span>
                  <span className="duration"><Clock size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {s.duration_minutes} min</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
