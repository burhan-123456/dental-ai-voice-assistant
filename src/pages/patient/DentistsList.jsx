import { useState, useEffect } from 'react';
import api from '../../api';
import { Clock, IndianRupee, Award, Phone } from 'lucide-react';

export default function DentistsList() {
  const [dentists, setDentists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDentists().then(setDentists).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Our Dentists</h1>
          <p className="page-subtitle">Meet our team of expert dental professionals</p>
        </div>
      </div>
      <div className="page-body">
        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /></div>
        ) : (
          <div className="dentist-grid">
            {dentists.map(d => (
              <div key={d.dentist_id} className="dentist-card">
                <div className="dentist-card-header">
                  <div className="dentist-avatar">{d.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                  <div>
                    <h3>{d.name}</h3>
                    <span className="dentist-specialty">{d.specialization}</span>
                  </div>
                </div>
                {d.bio && <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', margin: '0.75rem 0', lineHeight: 1.5 }}>{d.bio}</p>}
                <div className="dentist-details">
                  <span className="dentist-detail"><Award size={14} /> {d.qualification}</span>
                  <span className="dentist-detail"><Clock size={14} /> {d.experience_years} yrs</span>
                  <span className="dentist-detail"><IndianRupee size={14} /> ₹{d.consultation_fee}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
