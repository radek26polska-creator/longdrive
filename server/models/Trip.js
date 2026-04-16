const db = require('../database');

class Trip {
  static create(data) {
    return new Promise((resolve, reject) => {
      const {
        vehicleId, driverId, startTime, endTime,
        startOdometer, endOdometer, startLocation, endLocation,
        purpose, status = 'planned',
        startFuel, endFuel, fuelUsed, distance,
        fuelAdded, fuelCost, fuelReceiptNumber, fuelStation, notes, orderedBy,
        cardNumber
      } = data;

      db.run(
        `INSERT INTO trips (
          vehicleId, driverId, startTime, endTime,
          startOdometer, endOdometer, startLocation, endLocation,
          purpose, status, startFuel, endFuel, fuelUsed, distance,
          fuelAdded, fuelCost, fuelReceiptNumber, fuelStation, notes, orderedBy,
          cardNumber
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          vehicleId, driverId, startTime, endTime,
          startOdometer, endOdometer, startLocation, endLocation,
          purpose, status, startFuel || 0, endFuel || 0, fuelUsed || 0, distance || 0,
          fuelAdded || 0, fuelCost || 0, fuelReceiptNumber || null, fuelStation || null, 
          notes || null, orderedBy || null,
          cardNumber || null
        ],
        function(err) {
          if (err) {
            console.error('❌ Błąd INSERT trips:', err);
            return reject(err);
          }
          resolve({
            id: this.lastID,
            vehicleId, driverId, startTime, endTime,
            startOdometer, endOdometer, startLocation, endLocation,
            purpose, status, startFuel, endFuel, fuelUsed, distance,
            fuelAdded, fuelCost, fuelReceiptNumber, fuelStation, notes, orderedBy,
            cardNumber
          });
        }
      );
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT t.*,
                v.make, v.model, v.registrationNumber, v.fuelConsumption,
                v.bodyType, v.fuelType, v.engineCapacity, v.vehicleType, v.tankSize,
                d.firstName, d.lastName
         FROM trips t
         LEFT JOIN vehicles v ON t.vehicleId = v.id
         LEFT JOIN drivers d ON t.driverId = d.id
         WHERE t.id = ?`,
        [id],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  }

  static findAll(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT t.*,
               v.make, v.model, v.registrationNumber, v.fuelConsumption,
               v.bodyType, v.fuelType, v.engineCapacity, v.vehicleType, v.tankSize,
               d.firstName, d.lastName
        FROM trips t
        LEFT JOIN vehicles v ON t.vehicleId = v.id
        LEFT JOIN drivers d ON t.driverId = d.id
      `;
      const params = [];
      const conditions = [];

      if (filters.status) {
        conditions.push('t.status = ?');
        params.push(filters.status);
      }
      if (filters.vehicleId) {
        conditions.push('t.vehicleId = ?');
        params.push(filters.vehicleId);
      }
      if (filters.driverId) {
        conditions.push('t.driverId = ?');
        params.push(filters.driverId);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY t.id DESC';

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

      const allowedFields = [
        'vehicleId', 'driverId', 'startTime', 'endTime',
        'startOdometer', 'endOdometer', 'startLocation', 'endLocation',
        'purpose', 'status', 'startFuel', 'endFuel', 'fuelUsed', 'distance',
        'fuelAdded', 'fuelCost', 'fuelReceiptNumber', 'fuelStation', 'notes', 'orderedBy',
        'cardNumber'
      ];

      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      });

      if (fields.length === 0) {
        return resolve({ id });
      }

      values.push(id);

      db.run(
        `UPDATE trips SET ${fields.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) {
            console.error('❌ Błąd UPDATE trips:', err);
            return reject(err);
          }
          resolve({ id, ...data });
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM trips WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve({ deleted: this.changes > 0 });
      });
    });
  }
}

module.exports = Trip;