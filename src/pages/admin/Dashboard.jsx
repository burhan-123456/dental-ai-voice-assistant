import { useState, useEffect } from 'react';
import api from '../../api';
import { Users, Calendar, Stethoscope, IndianRupee, Activity, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Clinic overview and statistics</p>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /></div>
        ) : stats ? (
          <>
            <div className="stat-grid">
              <div className="stat-card primary">
                <div className="stat-icon primary"><Calendar size={24} /></div>
                <div><div className="stat-value">{stats.todayAppts}</div><div className="stat-label">Today's Appointments</div></div>
              </div>
              <div className="stat-card accent">
                <div className="stat-icon accent"><Users size={24} /></div>
                <div><div className="stat-value">{stats.totalPatients}</div><div className="stat-label">Total Patients</div></div>
              </div>
              <div className="stat-card warning">
                <div className="stat-icon warning"><Stethoscope size={24} /></div>
                <div><div className="stat-value">{stats.totalDentists}</div><div className="stat-label">Active Dentists</div></div>
              </div>
              <div className="stat-card success">
                <div className="stat-icon success"><IndianRupee size={24} /></div>
                <div><div className="stat-value">₹{stats.totalRevenue.toLocaleString()}</div><div className="stat-label">Total Revenue</div></div>
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Appointment Trends (Last 6 Months)</h3>
                </div>
                <div className="card-body" style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--gray-500)' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--gray-500)' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                      <Legend />
                      <Area type="monotone" dataKey="total" name="Total" stroke="var(--primary-500)" fill="var(--primary-100)" />
                      <Area type="monotone" dataKey="completed" name="Completed" stroke="var(--success-500)" fill="var(--success-50)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Popular Services</h3>
                </div>
                <div className="card-body" style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.servicePopularity} layout="vertical" margin={{ left: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-light)" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--gray-500)' }} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--gray-700)' }} />
                      <Tooltip cursor={{ fill: 'var(--gray-50)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                      <Bar dataKey="count" name="Bookings" fill="var(--accent-500)" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid-3">
              <div className="stat-card primary">
                <div className="stat-icon primary"><AlertCircle size={24} /></div>
                <div><div className="stat-value">{stats.pendingAppts}</div><div className="stat-label">Pending Appts</div></div>
              </div>
              <div className="stat-card success">
                <div className="stat-icon success"><Activity size={24} /></div>
                <div><div className="stat-value">{stats.completedAppts}</div><div className="stat-label">Completed Appts</div></div>
              </div>
              <div className="stat-card danger">
                <div className="stat-icon danger"><AlertCircle size={24} /></div>
                <div><div className="stat-value">{stats.cancelledAppts}</div><div className="stat-label">Cancelled Appts</div></div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
