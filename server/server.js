require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importy tras
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const driverRoutes = require('./routes/driverRoutes');
const tripRoutes = require('./routes/tripRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const refuelingRoutes = require('./routes/refuelingRoutes');
const keyLogRoutes = require('./routes/keyLogRoutes');
const companySettingsRoutes = require('./routes/companySettingsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Główne trasy API
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/refuelings', refuelingRoutes);
app.use('/api/key-logs', keyLogRoutes);
app.use('/api/company-settings', companySettingsRoutes);

// Przykładowa chroniona trasa
app.get('/api/protected', require('./middleware/auth').verifyToken, (req, res) => {
  res.json({ message: 'To jest chroniona trasa', user: req.user });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Obsługa błędów 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint nie istnieje' });
});

// Globalna obsługa błędów
app.use((err, req, res, next) => {
  console.error('Nieoczekiwany błąd:', err);
  res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
});

app.listen(PORT, () => {
  console.log(`✅ Serwer LongDrive uruchomiony na porcie ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
});