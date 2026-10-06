import { Router } from 'express';
import db from '../database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// ─── Book appointment (patient) ─────────────────────────────────
router.post('/', authenticate, (req, res) => {
  try {
    const { dentist_id, service_id, appointment_date, appointment_time } = req.body;

    if (!dentist_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'Dentist, date and time are required' });
    }

    // Validate dentist exists
    const dentist = db.prepare('SELECT * FROM dentist_profiles WHERE id = ? AND is_active = 1').get(dentist_id);
    if (!dentist) {
      return res.status(404).json({ error: 'Dentist not found or inactive' });
    }

    // Check holiday
    const holiday = db.prepare('SELECT * FROM clinic_holidays WHERE date = ?').get(appointment_date);
    if (holiday) {
      return res.status(400).json({ error: `Clinic is closed on ${appointment_date}: ${holiday.reason}` });
    }

    // Check dentist schedule for that day
    const dateObj = new Date(appointment_date);
    const dayOfWeek = dateObj.getDay();
    const schedule = db.prepare(
      'SELECT * FROM dentist_schedules WHERE dentist_id = ? AND day_of_week = ? AND is_available = 1'
    ).get(dentist_id, dayOfWeek);

    if (!schedule) {
      return res.status(400).json({ error: 'Dentist is not available on this day' });
    }

    // Check time is within schedule
    if (appointment_time < schedule.start_time || appointment_time >= schedule.end_time) {
      return res.status(400).json({ error: `Appointment time must be between ${schedule.start_time} and ${schedule.end_time}` });
    }

    // Check slot not already booked
    const existing = db.prepare(
      "SELECT id FROM appointments WHERE dentist_id = ? AND appointment_date = ? AND appointment_time = ? AND status NOT IN ('cancelled', 'rescheduled')"
    ).get(dentist_id, appointment_date, appointment_time);

    if (existing) {
      return res.status(409).json({ error: 'This time slot is already booked' });
    }

    // Calculate end time (30 min default)
    const service = service_id ? db.prepare('SELECT duration_minutes FROM services WHERE id = ?').get(service_id) : null;
    const durationMin = service ? service.duration_minutes : 30;
    const [h, m] = appointment_time.split(':').map(Number);
    const endMinutes = h * 60 + m + durationMin;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    const result = db.prepare(`
      INSERT INTO appointments (patient_id, dentist_id, service_id, appointment_date, appointment_time, end_time, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(req.user.id, dentist_id, service_id || null, appointment_date, appointment_time, endTime);

    const appointment = db.prepare(`
      SELECT a.*, u.name as patient_name, u2.name as dentist_name, s.name as service_name,
             dp.specialization
      FROM appointments a
      JOIN users u ON u.id = a.patient_id
      JOIN dentist_profiles dp ON dp.id = a.dentist_id
      JOIN users u2 ON u2.id = dp.user_id
      LEFT JOIN services s ON s.id = a.service_id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(appointment);
  } catch (err) {
    console.error('Book appointment error:', err);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// ─── Get patient's appointments ─────────────────────────────────
router.get('/my', authenticate, (req, res) => {
  try {
    const appointments = db.prepare(`
      SELECT a.*, u2.name as dentist_name, s.name as service_name,
             dp.specialization, dp.consultation_fee
      FROM appointments a
      JOIN dentist_profiles dp ON dp.id = a.dentist_id
      JOIN users u2 ON u2.id = dp.user_id
      LEFT JOIN services s ON s.id = a.service_id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `).all(req.user.id);
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// ─── Get dentist's appointments ─────────────────────────────────
router.get('/dentist', authenticate, authorize('dentist'), (req, res) => {
  try {
    const dentist = db.prepare('SELECT id FROM dentist_profiles WHERE user_id = ?').get(req.user.id);
    if (!dentist) return res.status(404).json({ error: 'Dentist profile not found' });

    const { date, status } = req.query;
    let query = `
      SELECT a.*, u.name as patient_name, u.email as patient_email, u.phone as patient_phone,
             s.name as service_name, s.price as service_price
      FROM appointments a
      JOIN users u ON u.id = a.patient_id
      LEFT JOIN services s ON s.id = a.service_id
      WHERE a.dentist_id = ?
    `;
    const params = [dentist.id];

    if (date) {
      query += ' AND a.appointment_date = ?';
      params.push(date);
    }
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.appointment_date ASC, a.appointment_time ASC';

    const appointments = db.prepare(query).all(...params);
    res.json(appointments);
  } catch (err) {
    console.error('Dentist appointments error:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// ─── Get all appointments (admin) ───────────────────────────────
router.get('/all', authenticate, authorize('admin'), (req, res) => {
  try {
    const { date, status, dentist_id } = req.query;
    let query = `
      SELECT a.*, u.name as patient_name, u.email as patient_email,
             u2.name as dentist_name, dp.specialization,
             s.name as service_name, s.price as service_price
      FROM appointments a
      JOIN users u ON u.id = a.patient_id
      JOIN dentist_profiles dp ON dp.id = a.dentist_id
      JOIN users u2 ON u2.id = dp.user_id
      LEFT JOIN services s ON s.id = a.service_id
      WHERE 1=1
    `;
    const params = [];

    if (date) { query += ' AND a.appointment_date = ?'; params.push(date); }
    if (status) { query += ' AND a.status = ?'; params.push(status); }
    if (dentist_id) { query += ' AND a.dentist_id = ?'; params.push(dentist_id); }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const appointments = db.prepare(query).all(...params);
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// ─── Get single appointment ────────────────────────────────────
router.get('/:id', authenticate, (req, res) => {
  try {
    const appointment = db.prepare(`
      SELECT a.*, u.name as patient_name, u.email as patient_email, u.phone as patient_phone,
             u2.name as dentist_name, dp.specialization,
             s.name as service_name, s.price as service_price
      FROM appointments a
      JOIN users u ON u.id = a.patient_id
      JOIN dentist_profiles dp ON dp.id = a.dentist_id
      JOIN users u2 ON u2.id = dp.user_id
      LEFT JOIN services s ON s.id = a.service_id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// ─── Update appointment status ──────────────────────────────────
router.patch('/:id/status', authenticate, (req, res) => {
  try {
    const { status, cancellation_reason, treatment_notes } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    let updateQuery = 'UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP';
    const params = [status];

    if (cancellation_reason) {
      updateQuery += ', cancellation_reason = ?';
      params.push(cancellation_reason);
    }
    if (treatment_notes) {
      updateQuery += ', treatment_notes = ?';
      params.push(treatment_notes);
    }

    updateQuery += ' WHERE id = ?';
    params.push(req.params.id);

    db.prepare(updateQuery).run(...params);

    const appointment = db.prepare(`
      SELECT a.*, u.name as patient_name, u2.name as dentist_name, s.name as service_name
      FROM appointments a
      JOIN users u ON u.id = a.patient_id
      JOIN dentist_profiles dp ON dp.id = a.dentist_id
      JOIN users u2 ON u2.id = dp.user_id
      LEFT JOIN services s ON s.id = a.service_id
      WHERE a.id = ?
    `).get(req.params.id);

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// ─── Add treatment notes (dentist) ──────────────────────────────
router.patch('/:id/notes', authenticate, authorize('dentist'), (req, res) => {
  try {
    const { treatment_notes, notes } = req.body;
    db.prepare(`
      UPDATE appointments SET
        treatment_notes = COALESCE(?, treatment_notes),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(treatment_notes, notes, req.params.id);
    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notes' });
  }
});

// ─── Reschedule appointment ─────────────────────────────────────
router.patch('/:id/reschedule', authenticate, (req, res) => {
  try {
    const { appointment_date, appointment_time } = req.body;
    if (!appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'New date and time required' });
    }

    // Get original appointment
    const original = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
    if (!original) return res.status(404).json({ error: 'Appointment not found' });

    // Check slot availability
    const existing = db.prepare(
      "SELECT id FROM appointments WHERE dentist_id = ? AND appointment_date = ? AND appointment_time = ? AND status NOT IN ('cancelled', 'rescheduled') AND id != ?"
    ).get(original.dentist_id, appointment_date, appointment_time, req.params.id);

    if (existing) {
      return res.status(409).json({ error: 'New time slot is already booked' });
    }

    // Mark old as rescheduled and create new
    db.prepare("UPDATE appointments SET status = 'rescheduled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);

    const result = db.prepare(`
      INSERT INTO appointments (patient_id, dentist_id, service_id, appointment_date, appointment_time, status, notes)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).run(original.patient_id, original.dentist_id, original.service_id, appointment_date, appointment_time, `Rescheduled from ${original.appointment_date} ${original.appointment_time}`);

    const newAppt = db.prepare(`
      SELECT a.*, u.name as patient_name, u2.name as dentist_name, s.name as service_name
      FROM appointments a
      JOIN users u ON u.id = a.patient_id
      JOIN dentist_profiles dp ON dp.id = a.dentist_id
      JOIN users u2 ON u2.id = dp.user_id
      LEFT JOIN services s ON s.id = a.service_id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    res.json(newAppt);
  } catch (err) {
    console.error('Reschedule error:', err);
    res.status(500).json({ error: 'Failed to reschedule' });
  }
});

export default router;
