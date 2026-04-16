const Refueling = require('../models/Refueling');

const refuelingController = {
  async getAll(req, res) {
    try {
      const { vehicleId } = req.query;
      const filters = {};
      if (vehicleId) filters.vehicleId = vehicleId;
      const refuelings = await Refueling.findAll(filters);
      res.json(refuelings);
    } catch (error) {
      console.error('Błąd podczas pobierania tankowań:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  async getOne(req, res) {
    try {
      const refueling = await Refueling.findById(req.params.id);
      if (!refueling) return res.status(404).json({ error: 'Tankowanie nie znalezione' });
      res.json(refueling);
    } catch (error) {
      console.error('Błąd podczas pobierania tankowania:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  async create(req, res) {
    try {
      const { vehicleId, date, liters, cost, mileage, invoiceNumber, notes, fullTank, tripId } = req.body;
      if (!vehicleId || !liters || !cost) {
        return res.status(400).json({ error: 'Pojazd, ilość i koszt są wymagane' });
      }
      const newRefueling = await Refueling.create({
        vehicleId, date, liters, cost, mileage,
        invoiceNumber, notes, fullTank, tripId
      });
      res.status(201).json(newRefueling);
    } catch (error) {
      console.error('Błąd podczas tworzenia tankowania:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  async update(req, res) {
    try {
      const refueling = await Refueling.findById(req.params.id);
      if (!refueling) return res.status(404).json({ error: 'Tankowanie nie znalezione' });
      const updated = await Refueling.update(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error('Błąd podczas aktualizacji tankowania:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  async delete(req, res) {
    try {
      const refueling = await Refueling.findById(req.params.id);
      if (!refueling) return res.status(404).json({ error: 'Tankowanie nie znalezione' });
      const result = await Refueling.delete(req.params.id);
      res.json({ message: 'Tankowanie usunięte', deleted: result.deleted });
    } catch (error) {
      console.error('Błąd podczas usuwania tankowania:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  }
};

module.exports = refuelingController;