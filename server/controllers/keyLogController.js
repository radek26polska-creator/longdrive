const KeyLog = require('../models/KeyLog');

const keyLogController = {
  async getAll(req, res) {
    try {
      const { vehicleId, driverId, action } = req.query;
      const filters = {};
      if (vehicleId) filters.vehicleId = vehicleId;
      if (driverId) filters.driverId = driverId;
      if (action) filters.action = action;

      const logs = await KeyLog.findAll(filters);
      res.json(logs);
    } catch (error) {
      console.error('Błąd podczas pobierania logów kluczyków:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  async getOne(req, res) {
    try {
      const log = await KeyLog.findById(req.params.id);
      if (!log) {
        return res.status(404).json({ error: 'Log nie znaleziony' });
      }
      res.json(log);
    } catch (error) {
      console.error('Błąd podczas pobierania logu kluczyków:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  async create(req, res) {
    try {
      const { vehicleId, driverId, action } = req.body;
      if (!vehicleId || !driverId || !action) {
        return res.status(400).json({ error: 'Pojazd, kierowca i akcja są wymagane' });
      }
      if (!['issued', 'returned'].includes(action)) {
        return res.status(400).json({ error: 'Akcja musi być "issued" lub "returned"' });
      }

      const newLog = await KeyLog.create({ vehicleId, driverId, action });
      res.status(201).json(newLog);
    } catch (error) {
      console.error('Błąd podczas tworzenia logu kluczyków:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  async getActiveIssues(req, res) {
    try {
      const active = await KeyLog.findActiveIssues();
      res.json(active);
    } catch (error) {
      console.error('Błąd podczas pobierania aktywnych wydań kluczyków:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  async delete(req, res) {
    try {
      const log = await KeyLog.findById(req.params.id);
      if (!log) {
        return res.status(404).json({ error: 'Log nie znaleziony' });
      }

      const result = await KeyLog.delete(req.params.id);
      res.json({ message: 'Log usunięty', deleted: result.deleted });
    } catch (error) {
      console.error('Błąd podczas usuwania logu kluczyków:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  }
};

module.exports = keyLogController;