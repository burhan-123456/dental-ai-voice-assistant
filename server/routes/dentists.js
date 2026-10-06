import { Router } from 'express';
import db from '../database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// ─── Get all dentists (public) ──────────────────────────────────
router.get('/', (req, res) => {
  try {
    const dentists = db.prepare(`
      SELECT u.id as user_id, u.name, u.email, u.phone, u.avatar,
             dp.id as dentist_id, dp.specialization, dp.qualification,
             dp.experience_years, dp.bio, dp.consultation_fee, dp.is_active
      FROM users u
      JOIN dentist_profiles dp ON dp.user_id = u.id
      WHERE u.role = 'dentist' AND dp.is_active = 1
    `).all();
    res.json(dentists);
  } catch (err) {
    console.error('Get dentists error:', err);
    res.status(500).json({ error: 'Failed to fetch dentists' });
  }
});

// ─── Get single dentist with schedule ───────────────────────────
router.get('/:id', (req, res) => {
  try {
    const dentist = db.prepare(`
      SELECT u.id as user_id, u.name, u.email, u.phone, u.avatar,
             dp.id as dentist_id, dp.specialization, dp.qualification,
             dp.experience_years, dp.bio, dp.consultation_fee, dp.is_active
      FROM users u
      JOIN dentist_profiles dp ON dp.user_id = u.id
      WHERE dp.id = ?
    `).get(req.params.id);

    if (!dentist) {
      return res.status(404).json({ error: 'Dentist not found' });
    }

    const schedule = db.prepare(
      'SELECT * FROM dentist_schedules WHERE dentist_id = ? ORDER BY day_of_week'
    ).all(req.params.id);

    res.json({ ...dentist, schedule });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dentist' });
  }
});

// ─── Get dentist availability for a date ────────────────────────
router.get('/:id/availability', (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date parameter required' });
    }

    const dentistId = parseInt(req.params.id);
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Check if clinic is on holiday
    const holiday = db.prepare('SELECT * FROM clinic_holidays WHERE date = ?').get(date);
    if (holiday) {
      return res.json({ available: false, reason: `Clinic closed: ${holiday.reason}`, slots: [] });
    }

    // Get dentist schedule for that day
    const schedule = db.prepare(
      'SELECT * FROM dentist_schedules WHERE dentist_id = ? AND day_of_week = ? AND is_available = 1'
    ).get(dentistId, dayOfWeek);

    if (!schedule) {
      return res.json({ available: false, reason: 'Dentist not available on this day', slots: [] });
    }

    // Generate time slots (30 min each)
    const slots = [];
    const [startH, startM] = schedule.start_time.split(':').map(Number);
    const [endH, endM] = schedule.end_time.split(':').map(Number);
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // Get existing appointments for that date
    const existingAppts = db.prepare(
      "SELECT appointment_time FROM appointments WHERE dentist_id = ? AND appointment_date = ? AND status NOT IN ('cancelled', 'rescheduled')"
    ).all(dentistId, date);
    const bookedTimes = new Set(existingAppts.map(a => a.appointment_time));

    while (currentMinutes + 30 <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push({
        time: timeStr,
        available: !bookedTimes.has(timeStr)
      });
      currentMinutes += 30;
    }

    res.json({ available: true, slots, schedule });
  } catch (err) {
    console.error('Availability error:', err);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// ─── Update dentist schedule (dentist themselves) ───────────────
router.put('/schedule', authenticate, authorize('dentist'), (req, res) => {
  try {
    const { schedules } = req.body; // Array of { day_of_week, start_time, end_time, is_available }
    const dentist = db.prepare('SELECT id FROM dentist_profiles WHERE user_id = ?').get(req.user.id);

    if (!dentist) {
      return res.status(404).json({ error: 'Dentist profile not found' });
    }

    const upsert = db.prepare(`
      INSERT INTO dentist_schedules (dentist_id, day_of_week, start_time, end_time, is_available)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(dentist_id, day_of_week) DO UPDATE SET
        start_time = excluded.start_time,
        end_time = excluded.end_time,
        is_available = excluded.is_available
    `);

    const updateMany = db.transaction((items) => {
      for (const s of items) {
        upsert.run(dentist.id, s.day_of_week, s.start_time, s.end_time, s.is_available ? 1 : 0);
      }
    });

    updateMany(schedules);

    const updatedSchedule = db.prepare(
      'SELECT * FROM dentist_schedules WHERE dentist_id = ? ORDER BY day_of_week'
    ).all(dentist.id);

    res.json(updatedSchedule);
  } catch (err) {
    console.error('Update schedule error:', err);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

// ─── Get dentist's own profile ──────────────────────────────────
router.get('/me/profile', authenticate, authorize('dentist'), (req, res) => {
  try {
    const profile = db.prepare(`
      SELECT u.id as user_id, u.name, u.email, u.phone,
             dp.id as dentist_id, dp.specialization, dp.qualification,
             dp.experience_years, dp.bio, dp.consultation_fee, dp.is_active
      FROM users u
      JOIN dentist_profiles dp ON dp.user_id = u.id
      WHERE u.id = ?
    `).get(req.user.id);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const schedule = db.prepare(
      'SELECT * FROM dentist_schedules WHERE dentist_id = ? ORDER BY day_of_week'
    ).all(profile.dentist_id);

    res.json({ ...profile, schedule });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
