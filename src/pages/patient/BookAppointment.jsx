import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { CalendarDays, ArrowRight, ArrowLeft, Check, Clock, IndianRupee } from 'lucide-react';

export default function BookAppointment() {
  const [step, setStep] = useState(1);
  const [dentists, setDentists] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    Promise.all([api.getDentists(), api.getServices()])
      .then(([d, s]) => { setDentists(d); setServices(s); });
  }, []);

  const loadSlots = async (dentistId, date) => {
    setSlotsLoading(true);
    try {
      const data = await api.getDentistAvailability(dentistId, date);
      setSlots(data.slots || []);
      if (!data.available) toast.error(data.reason);
    } catch (err) { toast.error(err.message); }
    finally { setSlotsLoading(false); }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTime('');
    if (selectedDentist && date) {
      loadSlots(selectedDentist.dentist_id, date);
    }
  };

  const handleBook = async () => {
    setBooking(true);
    try {
      await api.bookAppointment({
        dentist_id: selectedDentist.dentist_id,
        service_id: selectedService?.id || null,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
      });
      toast.success('Appointment booked successfully! 🎉');
      setStep(5); // success
    } catch (err) { toast.error(err.message); }
    finally { setBooking(false); }
  };

  const today = new Date().toISOString().split('T')[0];
  const formatDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const formatTime = (t) => {
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Book Appointment</h1>
          <p className="page-subtitle">Step {Math.min(step, 4)} of 4</p>
        </div>
      </div>

      <div className="page-body">
        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '2rem' }}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= step ? 'var(--primary-500)' : 'var(--gray-200)',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        {/* Step 1: Select Dentist */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Choose your Dentist</h2>
            <div className="dentist-grid">
              {dentists.map(d => (
                <div key={d.dentist_id}
                  className={`dentist-card ${selectedDentist?.dentist_id === d.dentist_id ? 'selected' : ''}`}
                  style={selectedDentist?.dentist_id === d.dentist_id ? { borderColor: 'var(--primary-500)', boxShadow: '0 0 0 2px rgba(51,139,255,0.2)' } : {}}
                  onClick={() => setSelectedDentist(d)}>
                  <div className="dentist-card-header">
                    <div className="dentist-avatar">{d.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                    <div>
                      <h3>{d.name}</h3>
                      <span className="dentist-specialty">{d.specialization}</span>
                    </div>
                  </div>
                  <div className="dentist-details">
                    <span className="dentist-detail"><Clock size={14} /> {d.experience_years} yrs exp</span>
                    <span className="dentist-detail"><IndianRupee size={14} /> ₹{d.consultation_fee}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" disabled={!selectedDentist} onClick={() => setStep(2)}>
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}

        {/* Step 2: Select Service */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Select Service (optional)</h2>
            <div className="service-grid">
              {services.map(s => (
                <div key={s.id}
                  className="service-card"
                  style={selectedService?.id === s.id ? { borderColor: 'var(--primary-500)', boxShadow: '0 0 0 2px rgba(51,139,255,0.2)' } : { cursor: 'pointer' }}
                  onClick={() => setSelectedService(selectedService?.id === s.id ? null : s)}>
                  <span className="category">{s.category}</span>
                  <h3>{s.name}</h3>
                  <p className="description">{s.description}</p>
                  <div className="meta">
                    <span className="price">₹{s.price}</span>
                    <span className="duration"><Clock size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {s.duration_minutes} min</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}><ArrowLeft size={18} /> Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>
                {selectedService ? 'Continue' : 'Skip & Continue'} <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}

        {/* Step 3: Select Date & Time */}
        {step === 3 && (
          <>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Pick Date & Time</h2>
            <div className="grid-2">
              <div className="card">
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Select Date</label>
                    <input type="date" className="form-input" min={today}
                      value={selectedDate} onChange={e => handleDateChange(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Available Time Slots</label>
                  {!selectedDate ? (
                    <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>Select a date first</p>
                  ) : slotsLoading ? (
                    <div className="loading-container"><div className="loading-spinner" /></div>
                  ) : slots.length > 0 ? (
                    <div className="time-slots">
                      {slots.map(slot => (
                        <button key={slot.time}
                          className={`time-slot ${!slot.available ? 'booked' : ''} ${selectedTime === slot.time ? 'selected' : ''}`}
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}>
                          {formatTime(slot.time)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--danger-600)', fontSize: '0.875rem' }}>No slots available on this date</p>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}><ArrowLeft size={18} /> Back</button>
              <button className="btn btn-primary" disabled={!selectedDate || !selectedTime} onClick={() => setStep(4)}>
                Review <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Confirm Booking</h2>
            <div className="card" style={{ maxWidth: 500 }}>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: 'Dentist', value: `${selectedDentist.name} — ${selectedDentist.specialization}` },
                    { label: 'Service', value: selectedService?.name || 'General Consultation' },
                    { label: 'Date', value: formatDate(selectedDate) },
                    { label: 'Time', value: formatTime(selectedTime) },
                    { label: 'Fee', value: `₹${selectedService?.price || selectedDentist.consultation_fee}` },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>{item.label}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(3)}><ArrowLeft size={18} /> Back</button>
              <button className="btn btn-success btn-lg" onClick={handleBook} disabled={booking}>
                {booking ? 'Booking...' : 'Confirm Booking'} <Check size={18} />
              </button>
            </div>
          </>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="empty-state" style={{ padding: '4rem 2rem' }}>
            <div className="empty-state-icon" style={{ background: 'var(--success-50)', color: 'var(--success-600)', width: 100, height: 100, fontSize: '2rem' }}>
              <Check size={48} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>Booking Confirmed! 🎉</h3>
            <p style={{ maxWidth: 400 }}>
              Your appointment with {selectedDentist.name} on {formatDate(selectedDate)} at {formatTime(selectedTime)} has been booked.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => { setStep(1); setSelectedDentist(null); setSelectedService(null); setSelectedDate(''); setSelectedTime(''); }}>
                Book Another
              </button>
              <button className="btn btn-primary" onClick={() => window.location.href = '/appointments'}>
                View Appointments
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
