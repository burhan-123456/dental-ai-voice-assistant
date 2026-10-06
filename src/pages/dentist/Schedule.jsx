import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

export default function DentistSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    api.getDentistProfile()
      .then(data => {
        // Ensure all 7 days exist
        const sched = [...(data.schedule || [])];
        for (let i = 0; i < 7; i++) {
          if (!sched.find(s => s.day_of_week === i)) {
            sched.push({ day_of_week: i, start_time: '09:00', end_time: '17:00', is_available: 0 });
          }
        }
        setSchedule(sched.sort((a, b) => a.day_of_week - b.day_of_week));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (day) => {
    setSchedule(schedule.map(s => s.day_of_week === day ? { ...s, is_available: s.is_available ? 0 : 1 } : s));
  };

  const handleChange = (day, field, value) => {
    setSchedule(schedule.map(s => s.day_of_week === day ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateDentistSchedule(schedule);
      toast.success('Schedule updated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Schedule</h1>
          <p className="page-subtitle">Manage your working hours</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="page-body">
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-body">
            {loading ? (
              <div className="loading-container"><div className="loading-spinner" /></div>
            ) : (
              <div className="schedule-grid">
                {schedule.map(s => (
                  <div key={s.day_of_week} className="schedule-row">
                    <div className="day-name">{dayNames[s.day_of_week]}</div>
                    <div className={`schedule-toggle ${s.is_available ? 'active' : ''}`} onClick={() => handleToggle(s.day_of_week)} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)', width: 60 }}>
                      {s.is_available ? 'Working' : 'Off'}
                    </span>
                    {s.is_available ? (
                      <>
                        <input type="time" className="form-input" value={s.start_time} onChange={e => handleChange(s.day_of_week, 'start_time', e.target.value)} />
                        <span style={{ color: 'var(--gray-400)' }}>to</span>
                        <input type="time" className="form-input" value={s.end_time} onChange={e => handleChange(s.day_of_week, 'end_time', e.target.value)} />
                      </>
                    ) : (
                      <div style={{ flex: 1 }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
