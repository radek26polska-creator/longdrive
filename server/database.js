const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'longdrive.db');
const db = new sqlite3.Database(dbPath);

// Włączanie wsparcia dla kluczy obcych
db.run('PRAGMA foreign_keys = ON');

// Inicjalizacja tabel
db.serialize(() => {
  // Tabela użytkowników
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela pojazdów
  db.run(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      registrationNumber TEXT UNIQUE NOT NULL,
      year INTEGER,
      mileage INTEGER DEFAULT 0,
      fuelLevel REAL DEFAULT 0,
      tankSize REAL DEFAULT 50,
      fuelConsumption REAL DEFAULT 7.5,
      status TEXT DEFAULT 'available',
      vehicleType TEXT,
      fuelType TEXT,
      engineCapacity INTEGER,
      bodyType TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela kierowców
  db.run(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      licenseNumber TEXT UNIQUE,
      phone TEXT,
      email TEXT,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela tras - z WSZYSTKIMI potrzebnymi kolumnami
  db.run(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicleId INTEGER,
      driverId INTEGER,
      startTime DATETIME,
      endTime DATETIME,
      startOdometer INTEGER DEFAULT 0,
      endOdometer INTEGER DEFAULT 0,
      startLocation TEXT,
      endLocation TEXT,
      purpose TEXT,
      status TEXT DEFAULT 'planned',
      startFuel REAL DEFAULT 0,
      endFuel REAL DEFAULT 0,
      fuelUsed REAL DEFAULT 0,
      distance INTEGER DEFAULT 0,
      fuelAdded REAL DEFAULT 0,
      fuelCost REAL DEFAULT 0,
      fuelReceiptNumber TEXT,
      fuelStation TEXT,
      notes TEXT,
      orderedBy TEXT,
      cardNumber TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicleId) REFERENCES vehicles(id),
      FOREIGN KEY (driverId) REFERENCES drivers(id)
    )
  `);

  // Tabela lokalizacji w trakcie trasy
  db.run(`
    CREATE TABLE IF NOT EXISTS trip_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tripId INTEGER,
      lat REAL,
      lng REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE
    )
  `);

  // Tabela serwisów
  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicleId INTEGER,
      date DATE,
      description TEXT,
      cost REAL,
      odometer INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicleId) REFERENCES vehicles(id)
    )
  `);

  // Tabela tankowań
  db.run(`
    CREATE TABLE IF NOT EXISTS refuelings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicleId INTEGER,
      date DATE,
      liters REAL,
      cost REAL,
      mileage INTEGER,
      invoiceNumber TEXT,
      notes TEXT,
      fullTank BOOLEAN DEFAULT 0,
      tripId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicleId) REFERENCES vehicles(id),
      FOREIGN KEY (tripId) REFERENCES trips(id)
    )
  `);

  // Tabela logów kluczyków
  db.run(`
    CREATE TABLE IF NOT EXISTS key_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicleId INTEGER,
      driverId INTEGER,
      action TEXT CHECK(action IN ('issued', 'returned')),
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicleId) REFERENCES vehicles(id),
      FOREIGN KEY (driverId) REFERENCES drivers(id)
    )
  `);

  // Tabela ustawień firmy - Z PEŁNYMI KOLUMNAMI
  db.run(`
    CREATE TABLE IF NOT EXISTS company_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT,
      address TEXT,
      zipCode TEXT,
      city TEXT,
      nip TEXT,
      regon TEXT,
      tripNumberPrefix TEXT,
      tripNumberNext INTEGER DEFAULT 1,
      phone TEXT,
      email TEXT,
      website TEXT,
      logo TEXT,
      cardPrefix TEXT DEFAULT 'KD',
      cardCounter INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Wstaw domyślne ustawienia, jeśli nie istnieją
  db.get("SELECT * FROM company_settings WHERE id = 1", [], (err, row) => {
    if (!row) {
      db.run(
        `INSERT INTO company_settings (id, name, tripNumberPrefix, tripNumberNext, cardPrefix, cardCounter)
         VALUES (1, 'Moja Firma', 'TRIP-', 1, 'KD', 1)`
      );
      console.log('✅ Domyślne ustawienia firmy utworzone');
    }
  });

  // Dodanie domyślnego użytkownika admin
  db.get("SELECT * FROM users WHERE email = ?", ['admin@longdrive.pl'], (err, row) => {
    if (!row) {
      const saltRounds = 10;
      const defaultPassword = 'admin123';
      bcrypt.hash(defaultPassword, saltRounds, (err, hash) => {
        if (err) throw err;
        db.run(
          "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
          ['Administrator', 'admin@longdrive.pl', hash, 'admin']
        );
        console.log('✅ Domyślny użytkownik admin utworzony (admin@longdrive.pl / admin123)');
      });
    }
  });
});

console.log('✅ Baza danych SQLite zainicjalizowana: longdrive.db');

module.exports = db;