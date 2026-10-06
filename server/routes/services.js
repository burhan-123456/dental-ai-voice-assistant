import { Router } from 'express';
import db from '../database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// ─── Get all services (public) ──────────────────────────────────
router.get('/', (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY category, name').all();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// ─── Get single service ────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// ─── Create service (admin) ────────────────────────────────────
router.post('/', authenticate, authorize('admin'), (req, res) => {
  try {
    const { name, description, category, duration_minutes, price } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    const result = db.prepare(
      'INSERT INTO services (name, description, category, duration_minutes, price) VALUES (?, ?, ?, ?, ?)'
    ).run(name, description || '', category || 'General', duration_minutes || 30, price);
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// ─── Update service (admin) ────────────────────────────────────
router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const { name, description, category, duration_minutes, price, is_active } = req.body;
    db.prepare(`
      UPDATE services SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        duration_minutes = COALESCE(?, duration_minutes),
        price = COALESCE(?, price),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(name, description, category, duration_minutes, price, is_active, req.params.id);
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// ─── Delete service (admin) ────────────────────────────────────
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    db.prepare('UPDATE services SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Service deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;
