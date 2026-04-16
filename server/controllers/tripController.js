const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const CompanySettings = require('../models/CompanySettings');

const tripController = {
  async getAll(req, res) {
    try {
      const { status, vehicleId, driverId } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (vehicleId) filters.vehicleId = vehicleId;
      if (driverId) filters.driverId = driverId;

      const trips = await Trip.findAll(filters);
      res.json(trips);
    } catch (error) {
      console.error('Błąd podczas pobierania tras:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  async getOne(req, res) {
    try {
      const trip = await Trip.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ error: 'Trasa nie znaleziona' });
      }
      res.json(trip);
    } catch (error) {
      console.error('Błąd podczas pobierania trasy:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  async create(req, res) {
    try {
      const { 
        vehicleId, driverId, startTime, startOdometer, 
        startLocation, endLocation, purpose, status, 
        startFuel, orderedBy
      } = req.body;
      
      if (!vehicleId || !driverId) {
        return res.status(400).json({ error: 'Pojazd i kierowca są wymagane' });
      }

      const settings = await CompanySettings.get();
      const cardNumber = `${settings.cardPrefix || 'KD'}-${settings.cardCounter || 1}`;
      
      await CompanySettings.incrementCardCounter();

      console.log('📝 Tworzenie trasy:', { vehicleId, driverId, startOdometer, startFuel, cardNumber });

      const newTrip = await Trip.create({
        vehicleId,
        driverId,
        startTime: startTime || new Date().toISOString(),
        startOdometer: startOdometer || 0,
        startLocation,
        endLocation,
        purpose,
        status: status || 'in_progress',
        startFuel: startFuel || 0,
        orderedBy,
        cardNumber
      });
      
      res.status(201).json(newTrip);
    } catch (error) {
      console.error('❌ Błąd podczas tworzenia trasy:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  async update(req, res) {
    try {
      const trip = await Trip.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ error: 'Trasa nie znaleziona' });
      }

      // Automatycznie ustaw endTime gdy przejazd jest kończony
      if (req.body.status === 'completed' && !req.body.endTime) {
        req.body.endTime = new Date().toISOString();
        console.log('🕐 Automatycznie ustawiono endTime:', req.body.endTime);
      }

      if (req.body.status === 'completed' && req.body.endOdometer) {
        const vehicle = await Vehicle.findById(trip.vehicleId);
        
        if (vehicle) {
          const distance = req.body.endOdometer - trip.startOdometer;
          const fuelConsumption = vehicle.fuelConsumption || 7.5;
          const fuelUsed = (distance / 100) * fuelConsumption;
          
          const startFuel = trip.startFuel || 0;
          const fuelAdded = req.body.fuelAdded || 0;
          const newFuelLevel = Math.max(0, startFuel + fuelAdded - fuelUsed);
          
          console.log('📊 Obliczenia zakończenia:');
          console.log(`   Dystans: ${distance} km`);
          console.log(`   Zużycie: ${fuelUsed.toFixed(2)} L`);
          console.log(`   Nowy stan paliwa: ${newFuelLevel.toFixed(2)} L`);
          
          await Vehicle.update(vehicle.id, {
            mileage: req.body.endOdometer,
            fuelLevel: newFuelLevel
          });
          
          req.body.endFuel = newFuelLevel;
          req.body.fuelUsed = Number(fuelUsed.toFixed(2));
          req.body.distance = distance;
        }
      }

      const updated = await Trip.update(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error('❌ Błąd podczas aktualizacji trasy:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  async delete(req, res) {
    try {
      const trip = await Trip.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ error: 'Trasa nie znaleziona' });
      }

      const result = await Trip.delete(req.params.id);
      res.json({ message: 'Trasa usunięta', deleted: result.deleted });
    } catch (error) {
      console.error('Błąd podczas usuwania trasy:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  }
};

module.exports = tripController;