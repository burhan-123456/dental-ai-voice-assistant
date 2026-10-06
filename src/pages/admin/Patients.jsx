import { useState, useEffect } from 'react';
import api from '../../api';

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPatients().then(setPatients).catch(console.error).finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient Directory</h1>
          <p className="page-subtitle">View all registered patients</p>
        </div>
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
                      <th>Patient Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Joined Date</th>
                      <th>Appointments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map(p => (
                      <tr key={p.id}>
                        <td><div style={{ fontWeight: 500 }}>{p.name}</div></td>
                        <td>{p.email}</td>
                        <td>{p.phone || '-'}</td>
                        <td>{formatDate(p.created_at)}</td>
                        <td>{p.appointment_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
