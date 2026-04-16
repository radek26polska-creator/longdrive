// server/models/Driver.js
const db = require('../database');

class Driver {
  static create({ firstName, lastName, licenseNumber, phone, email, status = 'active' }) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO drivers (firstName, lastName, licenseNumber, phone, email, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [firstName, lastName, licenseNumber, phone, email, status],
        function(err) {
          if (err) return reject(err);
          resolve({
            id: this.lastID,
            firstName,
            lastName,
            licenseNumber,
            phone,
            email,
            status
          });
        }
      );
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM drivers WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  static findAll(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM drivers';
      const params = [];
      const conditions = [];

      if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY id DESC';

      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  static update(id, data) {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];

      if (data.firstName !== undefined) {
        fields.push('firstName = ?');
        values.push(data.firstName);
      }
      if (data.lastName !== undefined) {
        fields.push('lastName = ?');
        values.push(data.lastName);
      }
      if (data.licenseNumber !== undefined) {
        fields.push('licenseNumber = ?');
        values.push(data.licenseNumber);
      }
      if (data.phone !== undefined) {
        fields.push('phone = ?');
        values.push(data.phone);
      }
      if (data.email !== undefined) {
        fields.push('email = ?');
        values.push(data.email);
      }
      if (data.status !== undefined) {
        fields.push('status = ?');
        values.push(data.status);
      }

      values.push(id);

      db.run(
        `UPDATE drivers SET ${fields.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) return reject(err);
          resolve({ id, ...data });
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM drivers WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve({ deleted: this.changes > 0 });
      });
    });
  }
}

module.exports = Driver;