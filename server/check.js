import db from './database.js';
console.log(db.prepare('SELECT * FROM appointments').all());
