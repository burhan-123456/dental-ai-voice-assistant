import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let user;
      if (isLogin) {
        user = await login(form.email, form.password);
      } else {
        user = await register(form.name, form.email, form.password, form.phone);
      }
      toast.success(`Welcome, ${user.name}!`);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'dentist') navigate('/dentist/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <h1>SmileCare</h1>
        <p>
          Your trusted dental care partner. Book appointments, consult with expert dentists,
          and get AI-powered dental assistance — all in one place.
        </p>
        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon">🤖</div>
            <span>AI Assistant</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">📅</div>
            <span>Easy Booking</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">👨‍⚕️</div>
            <span>Expert Dentists</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">🎙️</div>
            <span>Voice Control</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2>{isLogin ? 'Welcome back' : 'Create account'}</h2>
          <p className="auth-subtitle">
            {isLogin ? 'Sign in to access your dental dashboard' : 'Register to get started with SmileCare'}
          </p>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" placeholder="John Doe"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  required={!isLogin} />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} className="form-input"
                  placeholder="••••••••" style={{ paddingRight: '2.5rem' }}
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  required />
                <button type="button"
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Phone (optional)</label>
                <input type="tel" className="form-input" placeholder="+91 98765 43210"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="auth-toggle">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <a onClick={() => { setIsLogin(!isLogin); setForm({ name: '', email: '', password: '', phone: '' }); }}>
              {isLogin ? 'Register' : 'Sign In'}
            </a>
          </div>

          {isLogin && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
              <strong>Demo Credentials:</strong><br />
              Patient: rahul@email.com / patient123<br />
              Dentist: priya@smilecare.com / dentist123<br />
              Admin: admin@smilecare.com / admin123
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
