const db = require('../database');

class CompanySettings {
  static async get() {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM company_settings WHERE id = 1', (err, row) => {
        if (err) {
          console.error('❌ Błąd odczytu ustawień:', err);
          return reject(err);
        }
        
        if (!row) {
          console.log('⚠️ Brak ustawień firmy, tworzę domyślne...');
          const defaultSettings = {
            id: 1,
            name: 'Moja Firma',
            address: '',
            zipCode: '',
            city: '',
            nip: '',
            regon: '',
            tripNumberPrefix: 'TRIP-',
            tripNumberNext: 1,
            phone: '',
            email: '',
            website: '',
            logo: '',
            cardPrefix: 'KD',
            cardCounter: 1
          };
          
          db.run(
            `INSERT INTO company_settings (
              id, name, address, zipCode, city, nip, regon, 
              tripNumberPrefix, tripNumberNext, phone, email, 
              website, logo, cardPrefix, cardCounter
            ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              defaultSettings.name, defaultSettings.address, defaultSettings.zipCode, 
              defaultSettings.city, defaultSettings.nip, defaultSettings.regon,
              defaultSettings.tripNumberPrefix, defaultSettings.tripNumberNext,
              defaultSettings.phone, defaultSettings.email, defaultSettings.website,
              defaultSettings.logo, defaultSettings.cardPrefix, defaultSettings.cardCounter
            ],
            (err) => {
              if (err) {
                console.error('❌ Błąd tworzenia ustawień:', err);
                return reject(err);
              }
              console.log('✅ Domyślne ustawienia firmy utworzone');
              resolve(defaultSettings);
            }
          );
        } else {
          console.log('✅ Ustawienia firmy odczytane:', row.name);
          resolve(row);
        }
      });
    });
  }

  static async update(data) {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      const allowedFields = [
        'name', 'address', 'zipCode', 'city', 'nip', 'regon',
        'tripNumberPrefix', 'tripNumberNext', 'phone', 'email', 
        'website', 'logo', 'cardPrefix', 'cardCounter'
      ];
      
      allowedFields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      });
      
      if (fields.length === 0) {
        console.log('⚠️ Brak pól do aktualizacji');
        return resolve(null);
      }
      
      // Dodajemy aktualizację timestamp
      fields.push('updatedAt = CURRENT_TIMESTAMP');
      // UWAGA: NIE dodajemy kolejnej wartości dla updatedAt, bo to jest funkcja SQL, nie parametr
      
      const sql = `UPDATE company_settings SET ${fields.join(', ')} WHERE id = 1`;
      console.log('📝 SQL:', sql);
      console.log('📝 Values:', values);
      
      db.run(sql, values, function(err) {
        if (err) {
          console.error('❌ Błąd UPDATE company_settings:', err.message);
          return reject(err);
        }
        console.log(`✅ Zaktualizowano ${this.changes} wierszy`);
        resolve({ id: 1, ...data });
      });
    });
  }
  
  static async incrementCardCounter() {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE company_settings SET cardCounter = cardCounter + 1, updatedAt = CURRENT_TIMESTAMP WHERE id = 1`,
        function(err) {
          if (err) {
            console.error('❌ Błąd inkrementacji licznika:', err);
            return reject(err);
          }
          resolve(this.changes > 0);
        }
      );
    });
  }
  
  static async getNextCardNumber() {
    const settings = await this.get();
    const prefix = settings.cardPrefix || 'KD';
    const nextNumber = settings.cardCounter || 1;
    return `${prefix}-${nextNumber}`;
  }
}

module.exports = CompanySettings;