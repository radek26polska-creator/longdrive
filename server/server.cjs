require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ============= FUNKCJE POMOCNICZE =============
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Brak tokenu autoryzacji' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Nieprawidłowy token' });
  }
};

// ============= TRASY AUTORYZACJI =============
// Rejestracja
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    
    // Sprawdź czy użytkownik istnieje
    const existingUser = await db.get(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser) {
      return res.status(400).json({ error: 'Użytkownik z tym emailem już istnieje' });
    }
    
    // Hashowanie hasła
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Dodaj użytkownika
    const result = await db.run(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [name, email, passwordHash, role]
    );
    
    // Generuj token
    const token = jwt.sign(
      { id: result.lastID, email, role },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'Rejestracja udana',
      token,
      user: { id: result.lastID, name, email, role }
    });
  } catch (error) {
    console.error('Błąd rejestracji:', error);
    res.status(500).json({ error: 'Błąd serwera podczas rejestracji' });
  }
});

// Logowanie
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Znajdź użytkownika
    const user = await db.get(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
    }
    
    // Sprawdź hasło
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
    }
    
    // Generuj token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Logowanie udane',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Błąd logowania:', error);
    res.status(500).json({ error: 'Błąd serwera podczas logowania' });
  }
});

// ============= TRASA DO POBRANIA DANYCH ZALOGOWANEGO UŻYTKOWNIKA =============
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    res.json(user);
  } catch (error) {
    console.error('Błąd pobierania profilu użytkownika:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============= TRASY POJAZDÓW =============
// Pobierz wszystkie pojazdy
app.get('/api/vehicles', verifyToken, async (req, res) => {
  try {
    const vehicles = await db.all('SELECT * FROM vehicles ORDER BY id DESC');
    res.json(vehicles);
  } catch (error) {
    console.error('Błąd pobierania pojazdów:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz pojedynczy pojazd
app.get('/api/vehicles/:id', verifyToken, async (req, res) => {
  try {
    const vehicle = await db.get('SELECT * FROM vehicles WHERE id = $1', [req.params.id]);
    if (!vehicle) {
      return res.status(404).json({ error: 'Pojazd nie znaleziony' });
    }
    res.json(vehicle);
  } catch (error) {
    console.error('Błąd pobierania pojazdu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Dodaj pojazd
app.post('/api/vehicles', verifyToken, async (req, res) => {
  try {
    const {
      make, model, registrationNumber, year, mileage, fuelLevel,
      tankSize, fuelConsumption, status, vehicleType, fuelType,
      engineCapacity, bodyType
    } = req.body;
    
    const result = await db.run(
      `INSERT INTO vehicles (
        make, model, registrationNumber, year, mileage, fuelLevel,
        tankSize, fuelConsumption, status, vehicleType, fuelType,
        engineCapacity, bodyType, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [make, model, registrationNumber, year, mileage, fuelLevel,
       tankSize, fuelConsumption, status, vehicleType, fuelType,
       engineCapacity, bodyType]
    );
    
    const newVehicle = await db.get('SELECT * FROM vehicles WHERE id = $1', [result.lastID]);
    res.status(201).json(newVehicle);
  } catch (error) {
    console.error('Błąd dodawania pojazdu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Aktualizuj pojazd
app.put('/api/vehicles/:id', verifyToken, async (req, res) => {
  try {
    const {
      make, model, registrationNumber, year, mileage, fuelLevel,
      tankSize, fuelConsumption, status, vehicleType, fuelType,
      engineCapacity, bodyType
    } = req.body;
    
    await db.run(
      `UPDATE vehicles SET
        make = $1, model = $2, registrationNumber = $3, year = $4,
        mileage = $5, fuelLevel = $6, tankSize = $7, fuelConsumption = $8,
        status = $9, vehicleType = $10, fuelType = $11, engineCapacity = $12,
        bodyType = $13, updated_at = CURRENT_TIMESTAMP
      WHERE id = $14`,
      [make, model, registrationNumber, year, mileage, fuelLevel,
       tankSize, fuelConsumption, status, vehicleType, fuelType,
       engineCapacity, bodyType, req.params.id]
    );
    
    const updatedVehicle = await db.get('SELECT * FROM vehicles WHERE id = $1', [req.params.id]);
    res.json(updatedVehicle);
  } catch (error) {
    console.error('Błąd aktualizacji pojazdu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Usuń pojazd
app.delete('/api/vehicles/:id', verifyToken, async (req, res) => {
  try {
    await db.run('DELETE FROM vehicles WHERE id = $1', [req.params.id]);
    res.json({ message: 'Pojazd usunięty pomyślnie' });
  } catch (error) {
    console.error('Błąd usuwania pojazdu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============= TRASY KIEROWCÓW =============
// Pobierz wszystkich kierowców
app.get('/api/drivers', verifyToken, async (req, res) => {
  try {
    const drivers = await db.all('SELECT * FROM drivers ORDER BY id DESC');
    res.json(drivers);
  } catch (error) {
    console.error('Błąd pobierania kierowców:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz pojedynczego kierowcę
app.get('/api/drivers/:id', verifyToken, async (req, res) => {
  try {
    const driver = await db.get('SELECT * FROM drivers WHERE id = $1', [req.params.id]);
    if (!driver) {
      return res.status(404).json({ error: 'Kierowca nie znaleziony' });
    }
    res.json(driver);
  } catch (error) {
    console.error('Błąd pobierania kierowcy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Dodaj kierowcę
app.post('/api/drivers', verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, licenseNumber, phone, email, status } = req.body;
    
    const result = await db.run(
      `INSERT INTO drivers (firstName, lastName, licenseNumber, phone, email, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [firstName, lastName, licenseNumber, phone, email, status || 'active']
    );
    
    const newDriver = await db.get('SELECT * FROM drivers WHERE id = $1', [result.lastID]);
    res.status(201).json(newDriver);
  } catch (error) {
    console.error('Błąd dodawania kierowcy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Aktualizuj kierowcę
app.put('/api/drivers/:id', verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, licenseNumber, phone, email, status } = req.body;
    
    await db.run(
      `UPDATE drivers SET
        firstName = $1, lastName = $2, licenseNumber = $3,
        phone = $4, email = $5, status = $6
      WHERE id = $7`,
      [firstName, lastName, licenseNumber, phone, email, status, req.params.id]
    );
    
    const updatedDriver = await db.get('SELECT * FROM drivers WHERE id = $1', [req.params.id]);
    res.json(updatedDriver);
  } catch (error) {
    console.error('Błąd aktualizacji kierowcy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Usuń kierowcę
app.delete('/api/drivers/:id', verifyToken, async (req, res) => {
  try {
    await db.run('DELETE FROM drivers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Kierowca usunięty pomyślnie' });
  } catch (error) {
    console.error('Błąd usuwania kierowcy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============= TRASY TRAS =============
// Pobierz wszystkie trasy
app.get('/api/trips', verifyToken, async (req, res) => {
  try {
    const trips = await db.all(`
      SELECT t.*, 
             v.make || ' ' || v.model as vehicleName,
             d.firstName || ' ' || d.lastName as driverName
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicleId = v.id
      LEFT JOIN drivers d ON t.driverId = d.id
      ORDER BY t.id DESC
    `);
    res.json(trips);
  } catch (error) {
    console.error('Błąd pobierania tras:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz pojedynczą trasę
app.get('/api/trips/:id', verifyToken, async (req, res) => {
  try {
    const trip = await db.get(`
      SELECT t.*, 
             v.make || ' ' || v.model as vehicleName,
             d.firstName || ' ' || d.lastName as driverName
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicleId = v.id
      LEFT JOIN drivers d ON t.driverId = d.id
      WHERE t.id = $1
    `, [req.params.id]);
    
    if (!trip) {
      return res.status(404).json({ error: 'Trasa nie znaleziona' });
    }
    res.json(trip);
  } catch (error) {
    console.error('Błąd pobierania trasy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Dodaj trasę
app.post('/api/trips', verifyToken, async (req, res) => {
  try {
    const {
      vehicleId, driverId, startTime, endTime, startOdometer, endOdometer,
      startLocation, endLocation, purpose, status, startFuel, endFuel,
      fuelUsed, distance, fuelAdded, fuelCost, fuelReceiptNumber,
      fuelStation, notes, orderedBy, cardNumber
    } = req.body;
    
    const result = await db.run(
      `INSERT INTO trips (
        vehicleId, driverId, startTime, endTime, startOdometer, endOdometer,
        startLocation, endLocation, purpose, status, startFuel, endFuel,
        fuelUsed, distance, fuelAdded, fuelCost, fuelReceiptNumber,
        fuelStation, notes, orderedBy, cardNumber, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, CURRENT_TIMESTAMP)`,
      [vehicleId, driverId, startTime, endTime, startOdometer, endOdometer,
       startLocation, endLocation, purpose, status, startFuel, endFuel,
       fuelUsed, distance, fuelAdded, fuelCost, fuelReceiptNumber,
       fuelStation, notes, orderedBy, cardNumber]
    );
    
    const newTrip = await db.get('SELECT * FROM trips WHERE id = $1', [result.lastID]);
    res.status(201).json(newTrip);
  } catch (error) {
    console.error('Błąd dodawania trasy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Aktualizuj trasę
app.put('/api/trips/:id', verifyToken, async (req, res) => {
  try {
    const {
      vehicleId, driverId, startTime, endTime, startOdometer, endOdometer,
      startLocation, endLocation, purpose, status, startFuel, endFuel,
      fuelUsed, distance, fuelAdded, fuelCost, fuelReceiptNumber,
      fuelStation, notes, orderedBy, cardNumber
    } = req.body;
    
    await db.run(
      `UPDATE trips SET
        vehicleId = $1, driverId = $2, startTime = $3, endTime = $4,
        startOdometer = $5, endOdometer = $6, startLocation = $7,
        endLocation = $8, purpose = $9, status = $10, startFuel = $11,
        endFuel = $12, fuelUsed = $13, distance = $14, fuelAdded = $15,
        fuelCost = $16, fuelReceiptNumber = $17, fuelStation = $18,
        notes = $19, orderedBy = $20, cardNumber = $21
      WHERE id = $22`,
      [vehicleId, driverId, startTime, endTime, startOdometer, endOdometer,
       startLocation, endLocation, purpose, status, startFuel, endFuel,
       fuelUsed, distance, fuelAdded, fuelCost, fuelReceiptNumber,
       fuelStation, notes, orderedBy, cardNumber, req.params.id]
    );
    
    const updatedTrip = await db.get('SELECT * FROM trips WHERE id = $1', [req.params.id]);
    res.json(updatedTrip);
  } catch (error) {
    console.error('Błąd aktualizacji trasy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Usuń trasę
app.delete('/api/trips/:id', verifyToken, async (req, res) => {
  try {
    await db.run('DELETE FROM trips WHERE id = $1', [req.params.id]);
    res.json({ message: 'Trasa usunięta pomyślnie' });
  } catch (error) {
    console.error('Błąd usuwania trasy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============= TRASY SERWISÓW =============
app.get('/api/services', verifyToken, async (req, res) => {
  try {
    const services = await db.all(`
      SELECT s.*, v.make || ' ' || v.model as vehicleName
      FROM services s
      LEFT JOIN vehicles v ON s.vehicleId = v.id
      ORDER BY s.id DESC
    `);
    res.json(services);
  } catch (error) {
    console.error('Błąd pobierania serwisów:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

app.post('/api/services', verifyToken, async (req, res) => {
  try {
    const { vehicleId, date, description, cost, odometer } = req.body;
    
    const result = await db.run(
      `INSERT INTO services (vehicleId, date, description, cost, odometer, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [vehicleId, date, description, cost, odometer]
    );
    
    const newService = await db.get('SELECT * FROM services WHERE id = $1', [result.lastID]);
    res.status(201).json(newService);
  } catch (error) {
    console.error('Błąd dodawania serwisu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

app.delete('/api/services/:id', verifyToken, async (req, res) => {
  try {
    await db.run('DELETE FROM services WHERE id = $1', [req.params.id]);
    res.json({ message: 'Serwis usunięty pomyślnie' });
  } catch (error) {
    console.error('Błąd usuwania serwisu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============= TRASY TANKOWAŃ =============
app.get('/api/refuelings', verifyToken, async (req, res) => {
  try {
    const refuelings = await db.all(`
      SELECT r.*, v.make || ' ' || v.model as vehicleName
      FROM refuelings r
      LEFT JOIN vehicles v ON r.vehicleId = v.id
      ORDER BY r.id DESC
    `);
    res.json(refuelings);
  } catch (error) {
    console.error('Błąd pobierania tankowań:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

app.post('/api/refuelings', verifyToken, async (req, res) => {
  try {
    const { vehicleId, date, liters, cost, mileage, invoiceNumber, notes, fullTank, tripId } = req.body;
    
    const result = await db.run(
      `INSERT INTO refuelings (vehicleId, date, liters, cost, mileage, invoiceNumber, notes, fullTank, tripId, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
      [vehicleId, date, liters, cost, mileage, invoiceNumber, notes, fullTank || false, tripId || null]
    );
    
    const newRefueling = await db.get('SELECT * FROM refuelings WHERE id = $1', [result.lastID]);
    res.status(201).json(newRefueling);
  } catch (error) {
    console.error('Błąd dodawania tankowania:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

app.delete('/api/refuelings/:id', verifyToken, async (req, res) => {
  try {
    await db.run('DELETE FROM refuelings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Tankowanie usunięte pomyślnie' });
  } catch (error) {
    console.error('Błąd usuwania tankowania:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============= TRASY LOGÓW KLUCZYKÓW =============
app.get('/api/key-logs', verifyToken, async (req, res) => {
  try {
    const logs = await db.all(`
      SELECT kl.*, 
             v.make || ' ' || v.model as vehicleName,
             d.firstName || ' ' || d.lastName as driverName
      FROM key_logs kl
      LEFT JOIN vehicles v ON kl.vehicleId = v.id
      LEFT JOIN drivers d ON kl.driverId = d.id
      ORDER BY kl.timestamp DESC
    `);
    res.json(logs);
  } catch (error) {
    console.error('Błąd pobierania logów kluczyków:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

app.post('/api/key-logs', verifyToken, async (req, res) => {
  try {
    const { vehicleId, driverId, action } = req.body;
    
    const result = await db.run(
      `INSERT INTO key_logs (vehicleId, driverId, action, timestamp)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [vehicleId, driverId, action]
    );
    
    const newLog = await db.get('SELECT * FROM key_logs WHERE id = $1', [result.lastID]);
    res.status(201).json(newLog);
  } catch (error) {
    console.error('Błąd dodawania logu kluczyka:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============= TRASY USTAWIENIA FIRMY =============
app.get('/api/company-settings', verifyToken, async (req, res) => {
  try {
    let settings = await db.get('SELECT * FROM company_settings WHERE id = 1');
    
    if (!settings) {
      await db.run(
        `INSERT INTO company_settings (id, name, tripNumberPrefix, tripNumberNext, cardPrefix, cardCounter)
         VALUES (1, 'Moja Firma', 'TRIP-', 1, 'KD', 1)`
      );
      settings = await db.get('SELECT * FROM company_settings WHERE id = 1');
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Błąd pobierania ustawień firmy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

app.put('/api/company-settings', verifyToken, async (req, res) => {
  try {
    const {
      name, address, zipCode, city, nip, regon,
      tripNumberPrefix, tripNumberNext, phone, email,
      website, logo, cardPrefix, cardCounter
    } = req.body;
    
    await db.run(
      `UPDATE company_settings SET
        name = $1, address = $2, zipCode = $3, city = $4,
        nip = $5, regon = $6, tripNumberPrefix = $7,
        tripNumberNext = $8, phone = $9, email = $10,
        website = $11, logo = $12, cardPrefix = $13,
        cardCounter = $14, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1`,
      [name, address, zipCode, city, nip, regon, tripNumberPrefix,
       tripNumberNext, phone, email, website, logo, cardPrefix, cardCounter]
    );
    
    const updatedSettings = await db.get('SELECT * FROM company_settings WHERE id = 1');
    res.json(updatedSettings);
  } catch (error) {
    console.error('Błąd aktualizacji ustawień firmy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============= TRASA CHRONIONA (TEST) =============
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: 'To jest chroniona trasa', user: req.user });
});

// ============= HEALTH CHECK =============
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============= OBSŁUGA BŁĘDÓW 404 =============
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint nie istnieje' });
});

// ============= GLOBALNA OBSŁUGA BŁĘDÓW =============
app.use((err, req, res, next) => {
  console.error('Nieoczekiwany błąd:', err);
  res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
});

// ============= URUCHOMIENIE SERWERA =============
app.listen(PORT, () => {
  console.log(`✅ Serwer LongDrive uruchomiony na porcie ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`📊 Środowisko: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Baza danych: PostgreSQL`);
});
