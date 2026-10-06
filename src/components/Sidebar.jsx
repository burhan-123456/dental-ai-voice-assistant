import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Calendar, Users, Stethoscope, Bot,
  Settings, LogOut, ClipboardList, Clock, UserPlus,
  BarChart3, CalendarDays, Menu, X, Building2
} from 'lucide-react';
import { useState } from 'react';

const patientLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/appointments', label: 'My Appointments', icon: Calendar },
  { to: '/dentists', label: 'Our Dentists', icon: Stethoscope },
  { to: '/services', label: 'Services', icon: ClipboardList },
  { to: '/assistant', label: 'AI Assistant', icon: Bot },
];

const dentistLinks = [
  { to: '/dentist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dentist/appointments', label: 'Appointments', icon: Calendar },
  { to: '/dentist/schedule', label: 'My Schedule', icon: Clock },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/appointments', label: 'Appointments', icon: Calendar },
  { to: '/admin/dentists', label: 'Dentists', icon: Stethoscope },
  { to: '/admin/patients', label: 'Patients', icon: Users },
  { to: '/admin/services', label: 'Services', icon: ClipboardList },
  { to: '/admin/holidays', label: 'Holidays', icon: CalendarDays },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = user?.role === 'admin' ? adminLinks :
                user?.role === 'dentist' ? dentistLinks : patientLinks;

  const roleLabel = user?.role === 'admin' ? 'Administrator' :
                    user?.role === 'dentist' ? 'Dentist' : 'Patient Portal';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}
        style={{ position: 'fixed', top: 16, left: 16, zIndex: 60 }}>
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 49 }}
             onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🦷</div>
          <div>
            <h1>SmileCare</h1>
            <span>{roleLabel}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Navigation</div>
            {links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <link.icon />
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
            <button className="btn-icon btn-ghost" onClick={handleLogout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
