const db = require('../database');
const bcrypt = require('bcrypt');

class User {
  static create({ name, email, password, role = 'user' }) {
    return new Promise((resolve, reject) => {
      const saltRounds = 10;
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) return reject(err);
        
        db.run(
          'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
          [name, email, hash, role],
          function(err) {
            if (err) return reject(err);
            resolve({ id: this.lastID, name, email, role });
          }
        );
      });
    });
  }

  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  // NOWA METODA
  static update(id, { name, email, password_hash }) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?',
        [name, email, password_hash, id],
        function(err) {
          if (err) return reject(err);
          resolve({ id, name, email });
        }
      );
    });
  }
}

module.exports = User;