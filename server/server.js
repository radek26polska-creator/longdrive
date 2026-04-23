require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

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

// ========== SERWOWANIE STATYCZNE FRONTENDU ==========
// Obsługa plików statycznych z folderu public (gdzie będzie frontend)
app.use(express.static(path.join(__dirname, 'public')));

// ========== PRZEKIEROWANIA DLA BŁĘDNYCH ŚCIEŻEK ==========
// Przekierowanie z /api/company-setting (bez 's') na /api/company-settings
app.all('/api/company-setting', (req, res) => {
  console.log(`🔄 Przekierowanie: ${req.method} /api/company-setting -> /api/company-settings`);
  req.url = '/api/company-settings';
  return app.handle(req, res);
});

// Dodatkowe przekierowanie dla /api/company-settings/ (z ukośnikiem na końcu)
app.all('/api/company-settings/', (req, res) => {
  console.log(`🔄 Przekierowanie: ${req.method} /api/company-settings/ -> /api/company-settings`);
  req.url = '/api/company-settings';
  return app.handle(req, res);
});

// ========== TRASY API ==========
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

// ========== OBSŁUGA FRONTENDU (React/Vite) ==========
// Wszystkie inne zapytania (nie zaczynające się od /api) zwracają index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Obsługa błędów 404 dla API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Endpoint API nie istnieje: ${req.method} ${req.path}` });
});

// Globalna obsługa błędów
app.use((err, req, res, next) => {
  console.error('❌ Nieoczekiwany błąd:', err);
  res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
});

app.listen(PORT, () => {
  console.log(`✅ Serwer LongDrive uruchomiony na porcie ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`📊 Środowisko: ${process.env.NODE_ENV || 'development'}`);
});
