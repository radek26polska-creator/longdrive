const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database'); // potrzebne do bezpośredniego zapytania w update

const authController = {
  // Rejestracja nowego użytkownika
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Użytkownik z tym emailem już istnieje' });
      }

      const newUser = await User.create({ name, email, password, role: role || 'user' });
      
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Rejestracja zakończona pomyślnie',
        user: newUser,
        token
      });
    } catch (error) {
      console.error('Błąd rejestracji:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  // Logowanie użytkownika
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email i hasło są wymagane' });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      delete user.password_hash;

      res.json({
        message: 'Logowanie pomyślne',
        user,
        token
      });
    } catch (error) {
      console.error('Błąd logowania:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  // Pobieranie danych zalogowanego użytkownika
  async me(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
      }
      res.json(user);
    } catch (error) {
      console.error('Błąd pobierania profilu:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  // Aktualizacja profilu użytkownika (imię, email, hasło)
  async update(req, res) {
    try {
      const { name, email, currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Pobierz aktualnego użytkownika z bazy (z hashem)
      const user = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!user) {
        return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
      }

      // Przygotuj dane do aktualizacji
      const updatedData = {
        name: name || user.name,
        email: email || user.email,
        password_hash: user.password_hash
      };

      // Jeśli podano nowe hasło, sprawdź stare i zaktualizuj
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Aby zmienić hasło, podaj obecne hasło' });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Obecne hasło jest nieprawidłowe' });
        }

        const saltRounds = 10;
        updatedData.password_hash = await bcrypt.hash(newPassword, saltRounds);
      }

      // Zapisz zmiany w bazie
      await User.update(userId, updatedData);

      // Zwróć zaktualizowane dane (bez hasła)
      const updatedUser = await User.findById(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error('Błąd aktualizacji profilu:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  }
};

module.exports = authController;