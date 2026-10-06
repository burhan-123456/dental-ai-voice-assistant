import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';
import BookAppointment from './pages/patient/BookAppointment';
import MyAppointments from './pages/patient/MyAppointments';
import DentistsList from './pages/patient/DentistsList';
import ServicesList from './pages/patient/ServicesList';
import VoiceAssistant from './pages/patient/VoiceAssistant';

// Dentist Pages
import DentistDashboard from './pages/dentist/Dashboard';
import DentistAppointments from './pages/dentist/Appointments';
import DentistSchedule from './pages/dentist/Schedule';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminAppointments from './pages/admin/Appointments';
import AdminDentists from './pages/admin/Dentists';
import AdminPatients from './pages/admin/Patients';
import AdminServices from './pages/admin/Services';
import AdminHolidays from './pages/admin/Holidays';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-container" style={{ height: '100vh' }}><div className="loading-spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  
  return children;
};

// Root Redirect
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-container" style={{ height: '100vh' }}><div className="loading-spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'dentist') return <Navigate to="/dentist/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ className: 'toast-custom', duration: 4000 }} />
        
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={<RootRedirect />} />

          <Route element={<Layout />}>
            {/* Patient Routes */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
            <Route path="/book" element={<ProtectedRoute allowedRoles={['patient']}><BookAppointment /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute allowedRoles={['patient']}><MyAppointments /></ProtectedRoute>} />
            <Route path="/dentists" element={<ProtectedRoute allowedRoles={['patient']}><DentistsList /></ProtectedRoute>} />
            <Route path="/services" element={<ProtectedRoute allowedRoles={['patient']}><ServicesList /></ProtectedRoute>} />
            <Route path="/assistant" element={<ProtectedRoute allowedRoles={['patient']}><VoiceAssistant /></ProtectedRoute>} />

            {/* Dentist Routes */}
            <Route path="/dentist/dashboard" element={<ProtectedRoute allowedRoles={['dentist']}><DentistDashboard /></ProtectedRoute>} />
            <Route path="/dentist/appointments" element={<ProtectedRoute allowedRoles={['dentist']}><DentistAppointments /></ProtectedRoute>} />
            <Route path="/dentist/schedule" element={<ProtectedRoute allowedRoles={['dentist']}><DentistSchedule /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/appointments" element={<ProtectedRoute allowedRoles={['admin']}><AdminAppointments /></ProtectedRoute>} />
            <Route path="/admin/dentists" element={<ProtectedRoute allowedRoles={['admin']}><AdminDentists /></ProtectedRoute>} />
            <Route path="/admin/patients" element={<ProtectedRoute allowedRoles={['admin']}><AdminPatients /></ProtectedRoute>} />
            <Route path="/admin/services" element={<ProtectedRoute allowedRoles={['admin']}><AdminServices /></ProtectedRoute>} />
            <Route path="/admin/holidays" element={<ProtectedRoute allowedRoles={['admin']}><AdminHolidays /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
