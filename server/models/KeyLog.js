// server/models/KeyLog.js
const db = require('../database');

class KeyLog {
  static create({ vehicleId, driverId, action }) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO key_logs (vehicleId, driverId, action)
         VALUES (?, ?, ?)`,
        [vehicleId, driverId, action],
        function(err) {
          if (err) return reject(err);
          resolve({
            id: this.lastID,
            vehicleId,
            driverId,
            action,
            timestamp: new Date().toISOString()
          });
        }
      );
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM key_logs WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  static findAll(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM key_logs';
      const params = [];
      const conditions = [];

      if (filters.vehicleId) {
        conditions.push('vehicleId = ?');
        params.push(filters.vehicleId);
      }
      if (filters.driverId) {
        conditions.push('driverId = ?');
        params.push(filters.driverId);
      }
      if (filters.action) {
        conditions.push('action = ?');
        params.push(filters.action);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY timestamp DESC';

      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  // Specjalna metoda: znajdź aktywne wydania kluczyków (issued bez returned)
  static findActiveIssues() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT kl1.* FROM key_logs kl1
         LEFT JOIN key_logs kl2 ON kl1.vehicleId = kl2.vehicleId 
           AND kl2.action = 'returned' AND kl2.timestamp > kl1.timestamp
         WHERE kl1.action = 'issued' AND kl2.id IS NULL
         ORDER BY kl1.timestamp DESC`,
        [],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM key_logs WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve({ deleted: this.changes > 0 });
      });
    });
  }
}

module.exports = KeyLog;