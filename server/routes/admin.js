import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

// ─── Dashboard stats ────────────────────────────────────────────
router.get('/stats', (req, res) => {
  try {
    const totalPatients = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'patient'").get().count;
    const totalDentists = db.prepare("SELECT COUNT(*) as count FROM dentist_profiles WHERE is_active = 1").get().count;
    const totalAppointments = db.prepare("SELECT COUNT(*) as count FROM appointments").get().count;
    const todayAppts = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE appointment_date = date('now')").get().count;
    const pendingAppts = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'").get().count;
    const completedAppts = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'completed'").get().count;
    const cancelledAppts = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'cancelled'").get().count;
    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(s.price), 0) as total
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      WHERE a.status = 'completed'
    `).get().total;

    // Monthly appointment data (last 6 months)
    const monthlyData = db.prepare(`
      SELECT
        strftime('%Y-%m', appointment_date) as month,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM appointments
      WHERE appointment_date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', appointment_date)
      ORDER BY month
    `).all();

    // Service popularity
    const servicePopularity = db.prepare(`
      SELECT s.name, COUNT(a.id) as count
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      GROUP BY s.id
      ORDER BY count DESC
      LIMIT 5
    `).all();

    // Appointments by status
    const statusBreakdown = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM appointments
      GROUP BY status
    `).all();

    res.json({
      totalPatients, totalDentists, totalAppointments, todayAppts,
      pendingAppts, completedAppts, cancelledAppts, totalRevenue,
      monthlyData, servicePopularity, statusBreakdown
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── Get all patients ───────────────────────────────────────────
router.get('/patients', (req, res) => {
  try {
    const patients = db.prepare(`
      SELECT id, name, email, phone, created_at,
        (SELECT COUNT(*) FROM appointments WHERE patient_id = users.id) as appointment_count
      FROM users WHERE role = 'patient'
      ORDER BY created_at DESC
    `).all();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// ─── Get all dentists (with full details) ───────────────────────
router.get('/dentists', (req, res) => {
  try {
    const dentists = db.prepare(`
      SELECT u.id as user_id, u.name, u.email, u.phone, u.created_at,
             dp.id as dentist_id, dp.specialization, dp.qualification,
             dp.experience_years, dp.consultation_fee, dp.is_active,
        (SELECT COUNT(*) FROM appointments WHERE dentist_id = dp.id) as appointment_count
      FROM users u
      JOIN dentist_profiles dp ON dp.user_id = u.id
      WHERE u.role = 'dentist'
      ORDER BY u.name
    `).all();
    res.json(dentists);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dentists' });
  }
});

// ─── Add new dentist ────────────────────────────────────────────
router.post('/dentists', (req, res) => {
  try {
    const { name, email, password, phone, specialization, qualification, experience_years, consultation_fee, bio } = req.body;

    if (!name || !email || !password || !specialization) {
      return res.status(400).json({ error: 'Name, email, password and specialization are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const addDentist = db.transaction(() => {
      const userResult = db.prepare(
        'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)'
      ).run(name, email, hashedPassword, phone || null, 'dentist');

      const profileResult = db.prepare(
        'INSERT INTO dentist_profiles (user_id, specialization, qualification, experience_years, consultation_fee, bio) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(userResult.lastInsertRowid, specialization, qualification || '', experience_years || 0, consultation_fee || 500, bio || '');

      // Set default schedule (Mon-Sat 9am-5pm)
      const insertSchedule = db.prepare(
        'INSERT INTO dentist_schedules (dentist_id, day_of_week, start_time, end_time, is_available) VALUES (?, ?, ?, ?, ?)'
      );
      for (let day = 1; day <= 6; day++) {
        insertSchedule.run(profileResult.lastInsertRowid, day, '09:00', '17:00', 1);
      }
      // Sunday off
      insertSchedule.run(profileResult.lastInsertRowid, 0, '09:00', '17:00', 0);

      return profileResult.lastInsertRowid;
    });

    const dentistId = addDentist();

    const dentist = db.prepare(`
      SELECT u.id as user_id, u.name, u.email, u.phone,
             dp.id as dentist_id, dp.specialization, dp.qualification,
             dp.experience_years, dp.consultation_fee, dp.is_active
      FROM users u JOIN dentist_profiles dp ON dp.user_id = u.id
      WHERE dp.id = ?
    `).get(dentistId);

    res.status(201).json(dentist);
  } catch (err) {
    console.error('Add dentist error:', err);
    res.status(500).json({ error: 'Failed to add dentist' });
  }
});

// ─── Update dentist ─────────────────────────────────────────────
router.put('/dentists/:id', (req, res) => {
  try {
    const { name, phone, specialization, qualification, experience_years, consultation_fee, is_active, bio } = req.body;
    const dentist = db.prepare('SELECT * FROM dentist_profiles WHERE id = ?').get(req.params.id);
    if (!dentist) return res.status(404).json({ error: 'Dentist not found' });

    db.prepare('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?')
      .run(name, phone, dentist.user_id);

    db.prepare(`
      UPDATE dentist_profiles SET
        specialization = COALESCE(?, specialization),
        qualification = COALESCE(?, qualification),
        experience_years = COALESCE(?, experience_years),
        consultation_fee = COALESCE(?, consultation_fee),
        is_active = COALESCE(?, is_active),
        bio = COALESCE(?, bio)
      WHERE id = ?
    `).run(specialization, qualification, experience_years, consultation_fee, is_active, bio, req.params.id);

    const updated = db.prepare(`
      SELECT u.id as user_id, u.name, u.email, u.phone,
             dp.id as dentist_id, dp.specialization, dp.qualification,
             dp.experience_years, dp.consultation_fee, dp.is_active
      FROM users u JOIN dentist_profiles dp ON dp.user_id = u.id
      WHERE dp.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update dentist' });
  }
});

// ─── Delete dentist ─────────────────────────────────────────────
router.delete('/dentists/:id', (req, res) => {
  try {
    db.prepare('UPDATE dentist_profiles SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Dentist deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate dentist' });
  }
});

// ─── Manage holidays ────────────────────────────────────────────
router.get('/holidays', (req, res) => {
  try {
    const holidays = db.prepare('SELECT * FROM clinic_holidays ORDER BY date').all();
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

router.post('/holidays', (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });
    const result = db.prepare('INSERT OR REPLACE INTO clinic_holidays (date, reason) VALUES (?, ?)').run(date, reason || 'Holiday');
    res.status(201).json({ id: result.lastInsertRowid, date, reason });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add holiday' });
  }
});

router.delete('/holidays/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM clinic_holidays WHERE id = ?').run(req.params.id);
    res.json({ message: 'Holiday removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove holiday' });
  }
});

export default router;
