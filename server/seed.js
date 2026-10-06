import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db from './database.js';

console.log('🌱 Seeding database...\n');

// ─── Clear existing data ────────────────────────────────────────
db.exec(`
  DELETE FROM chat_history;
  DELETE FROM appointments;
  DELETE FROM dentist_schedules;
  DELETE FROM dentist_profiles;
  DELETE FROM services;
  DELETE FROM clinic_holidays;
  DELETE FROM clinic_settings;
  DELETE FROM users;
`);

const hash = (pw) => bcrypt.hashSync(pw, 10);

// ─── Create Admin ───────────────────────────────────────────────
db.prepare('INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)').run(
  'Admin User', 'admin@smilecare.com', hash('admin123'), '9876543210', 'admin'
);
console.log('✅ Admin created: admin@smilecare.com / admin123');

// ─── Create Dentists ────────────────────────────────────────────
const dentists = [
  { name: 'Dr. Priya Sharma', email: 'priya@smilecare.com', phone: '9876543211', specialization: 'Orthodontics', qualification: 'BDS, MDS (Orthodontics)', experience: 12, fee: 800, bio: 'Specialist in braces, aligners and smile correction. Over 12 years of experience.' },
  { name: 'Dr. Rajesh Kumar', email: 'rajesh@smilecare.com', phone: '9876543212', specialization: 'Endodontics', qualification: 'BDS, MDS (Conservative Dentistry)', experience: 8, fee: 600, bio: 'Expert in root canal treatments and dental restorations. Pain-free procedures guaranteed.' },
  { name: 'Dr. Anita Patel', email: 'anita@smilecare.com', phone: '9876543213', specialization: 'Pediatric Dentistry', qualification: 'BDS, MDS (Pedodontics)', experience: 10, fee: 500, bio: 'Child-friendly dentist with a gentle approach. Makes dental visits fun for kids.' },
  { name: 'Dr. Vikram Singh', email: 'vikram@smilecare.com', phone: '9876543214', specialization: 'Oral Surgery', qualification: 'BDS, MDS (Oral & Maxillofacial Surgery)', experience: 15, fee: 1000, bio: 'Expert oral surgeon specializing in wisdom tooth extraction and dental implants.' },
  { name: 'Dr. Meera Reddy', email: 'meera@smilecare.com', phone: '9876543215', specialization: 'Cosmetic Dentistry', qualification: 'BDS, Certificate in Cosmetic Dentistry', experience: 7, fee: 700, bio: 'Transform your smile with professional teeth whitening, veneers and cosmetic procedures.' },
];

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const insertSchedule = db.prepare(
  'INSERT INTO dentist_schedules (dentist_id, day_of_week, start_time, end_time, is_available) VALUES (?, ?, ?, ?, ?)'
);

for (const d of dentists) {
  const userResult = db.prepare('INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)').run(
    d.name, d.email, hash('dentist123'), d.phone, 'dentist'
  );
  const profileResult = db.prepare(
    'INSERT INTO dentist_profiles (user_id, specialization, qualification, experience_years, consultation_fee, bio) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userResult.lastInsertRowid, d.specialization, d.qualification, d.experience, d.fee, d.bio);

  // Schedule: Mon-Fri 9am-5pm, Sat 9am-1pm, Sun off
  for (let day = 1; day <= 5; day++) {
    insertSchedule.run(profileResult.lastInsertRowid, day, '09:00', '17:00', 1);
  }
  insertSchedule.run(profileResult.lastInsertRowid, 6, '09:00', '13:00', 1); // Saturday
  insertSchedule.run(profileResult.lastInsertRowid, 0, '09:00', '17:00', 0); // Sunday off

  console.log(`✅ Dentist: ${d.name} (${d.email} / dentist123)`);
}

// ─── Create Services ────────────────────────────────────────────
const services = [
  { name: 'General Checkup', description: 'Comprehensive dental examination with oral health assessment', category: 'Preventive', duration: 30, price: 300 },
  { name: 'Teeth Cleaning', description: 'Professional dental cleaning and scaling to remove plaque and tartar', category: 'Preventive', duration: 45, price: 500 },
  { name: 'Dental X-Ray', description: 'Digital dental X-ray for accurate diagnosis', category: 'Diagnostic', duration: 15, price: 200 },
  { name: 'Root Canal Treatment', description: 'Single sitting root canal treatment with advanced technology', category: 'Restorative', duration: 60, price: 3000 },
  { name: 'Tooth Extraction', description: 'Painless tooth extraction under local anesthesia', category: 'Surgical', duration: 30, price: 800 },
  { name: 'Wisdom Tooth Removal', description: 'Surgical extraction of impacted wisdom teeth', category: 'Surgical', duration: 60, price: 2500 },
  { name: 'Dental Filling', description: 'Composite tooth-colored filling for cavities', category: 'Restorative', duration: 30, price: 500 },
  { name: 'Teeth Whitening', description: 'Professional in-office teeth whitening for a brighter smile', category: 'Cosmetic', duration: 60, price: 3500 },
  { name: 'Dental Crown', description: 'Porcelain or ceramic crown for damaged teeth', category: 'Restorative', duration: 45, price: 4000 },
  { name: 'Dental Bridge', description: 'Fixed bridge to replace missing teeth', category: 'Restorative', duration: 60, price: 6000 },
  { name: 'Braces (Metal)', description: 'Traditional metal braces for teeth alignment', category: 'Orthodontics', duration: 45, price: 25000 },
  { name: 'Clear Aligners', description: 'Invisible aligners for discreet teeth straightening', category: 'Orthodontics', duration: 30, price: 40000 },
  { name: 'Dental Implant', description: 'Titanium dental implant with crown for missing teeth', category: 'Surgical', duration: 90, price: 20000 },
  { name: 'Dental Veneer', description: 'Porcelain veneers for a perfect smile makeover', category: 'Cosmetic', duration: 45, price: 5000 },
  { name: 'Gum Treatment', description: 'Periodontal treatment for gum disease', category: 'Preventive', duration: 45, price: 1500 },
  { name: 'Child Dental Checkup', description: 'Gentle dental checkup designed for children', category: 'Pediatric', duration: 30, price: 250 },
  { name: 'Fluoride Treatment', description: 'Fluoride application for cavity prevention', category: 'Preventive', duration: 15, price: 300 },
  { name: 'Dental Sealant', description: 'Protective sealant for children\'s teeth', category: 'Pediatric', duration: 20, price: 400 },
];

for (const s of services) {
  db.prepare(
    'INSERT INTO services (name, description, category, duration_minutes, price) VALUES (?, ?, ?, ?, ?)'
  ).run(s.name, s.description, s.category, s.duration, s.price);
}
console.log(`✅ ${services.length} dental services created`);

// ─── Create sample patients ─────────────────────────────────────
const patients = [
  { name: 'Rahul Verma', email: 'rahul@email.com', phone: '9876500001' },
  { name: 'Sneha Gupta', email: 'sneha@email.com', phone: '9876500002' },
  { name: 'Amit Joshi', email: 'amit@email.com', phone: '9876500003' },
];

for (const p of patients) {
  db.prepare('INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)').run(
    p.name, p.email, hash('patient123'), p.phone, 'patient'
  );
  console.log(`✅ Patient: ${p.name} (${p.email} / patient123)`);
}

// ─── Create sample appointments ─────────────────────────────────
const today = new Date();
const formatDate = (d) => d.toISOString().split('T')[0];

// Tomorrow
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1); // skip Sunday

const nextDay = new Date(tomorrow);
nextDay.setDate(tomorrow.getDate() + 1);
if (nextDay.getDay() === 0) nextDay.setDate(nextDay.getDate() + 1);

const prevDay = new Date(today);
prevDay.setDate(today.getDate() - 2);

const patientIds = db.prepare("SELECT id FROM users WHERE role = 'patient'").all().map(u => u.id);
const dentistIds = db.prepare("SELECT id FROM dentist_profiles").all().map(d => d.id);

const sampleAppts = [
  { patient: patientIds[0], dentist: dentistIds[0], service: 1, date: formatDate(tomorrow), time: '10:00', status: 'confirmed' },
  { patient: patientIds[0], dentist: dentistIds[1], service: 4, date: formatDate(nextDay), time: '14:00', status: 'pending' },
  { patient: patientIds[1], dentist: dentistIds[2], service: 16, date: formatDate(tomorrow), time: '11:00', status: 'confirmed' },
  { patient: patientIds[1], dentist: dentistIds[0], service: 2, date: formatDate(prevDay), time: '09:30', status: 'completed' },
  { patient: patientIds[2], dentist: dentistIds[3], service: 5, date: formatDate(tomorrow), time: '15:30', status: 'pending' },
  { patient: patientIds[2], dentist: dentistIds[4], service: 8, date: formatDate(prevDay), time: '11:00', status: 'completed' },
];

for (const a of sampleAppts) {
  db.prepare(`
    INSERT INTO appointments (patient_id, dentist_id, service_id, appointment_date, appointment_time, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(a.patient, a.dentist, a.service, a.date, a.time, a.status);
}
console.log(`✅ ${sampleAppts.length} sample appointments created`);

// ─── Clinic settings ────────────────────────────────────────────
const settings = [
  { key: 'clinic_name', value: 'SmileCare Dental Clinic' },
  { key: 'clinic_phone', value: '+91 98765 43210' },
  { key: 'clinic_email', value: 'info@smilecare.com' },
  { key: 'clinic_address', value: '123 Health Avenue, Medical Complex, Mumbai - 400001' },
  { key: 'opening_time', value: '09:00' },
  { key: 'closing_time', value: '18:00' },
  { key: 'slot_duration', value: '30' },
];

for (const s of settings) {
  db.prepare('INSERT OR REPLACE INTO clinic_settings (key, value) VALUES (?, ?)').run(s.key, s.value);
}
console.log('✅ Clinic settings configured');

console.log('\n🎉 Database seeded successfully!\n');
console.log('═══════════════════════════════════════════');
console.log('  LOGIN CREDENTIALS');
console.log('═══════════════════════════════════════════');
console.log('  Admin:   admin@smilecare.com / admin123');
console.log('  Dentist: priya@smilecare.com / dentist123');
console.log('  Patient: rahul@email.com     / patient123');
console.log('═══════════════════════════════════════════\n');
